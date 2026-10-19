"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import PageError from "@/components/ui/PageError";
import BarcodeScanner from "@/components/ui/BarcodeScanner";
import ProductAvatar from "@/components/estoque/ProductAvatar";
import StatusChip from "@/components/estoque/StatusChip";
import LevelBar from "@/components/estoque/LevelBar";
import ProductPanel from "@/components/estoque/ProductPanel";
import MovementSheet from "@/components/estoque/MovementSheet";
import { supabase } from "@/lib/supabase";
import { sanitizeCode } from "@/lib/sanitize";
import { getWorkspace } from "@/hooks/useWorkspace";
import { useRole, can } from "@/hooks/useRole";
import { useProducts, mutateProducts, type Product } from "@/hooks/useProducts";
import { mutateStats } from "@/hooks/useStats";
import { mutateMovements } from "@/hooks/useMovements";
import { deriveStatus, formatBRL, formatQty, stockLevel, previsaoDias, formatPrevisao, estaParado, type StockStatus } from "@/lib/stock";
import { useForecast } from "@/hooks/useForecast";
import { useLastOutflow } from "@/hooks/useLastOutflow";
import { usePlan, planInfo } from "@/hooks/usePlan";
import { PlusIcon, SearchIcon, ScanIcon, DocumentIcon, PlusMinusIcon, BoxIcon, UploadIcon } from "@/components/ui/icons";

type Filter = "todos" | StockStatus | "parados";
type Sort   = "nome" | "menor" | "valor";

interface Row extends Product { status: StockStatus }

const FILTERS: { id: Filter; label: string; dot?: string }[] = [
  { id: "todos",  label: "Todos" },
  { id: "normal", label: "Normal", dot: "bg-ok" },
  { id: "baixo",  label: "Baixo",  dot: "bg-low" },
  { id: "zerado", label: "Zerado", dot: "bg-zero" },
];

/* Mesmo breakpoint do menu lateral (lg): a partir daqui a lista ganha o painel de detalhe */
const DESKTOP_QUERY = "(min-width: 1024px)";

function ProductCard({ p, selected, previsao, onOpen, onMove }: {
  p: Row;
  selected: boolean;
  /** Dias até acabar (EQZ-16); na lista só aparece quando falta uma semana ou menos */
  previsao: number | null;
  onOpen: () => void;
  onMove?: () => void;
}) {
  const level = stockLevel(p.qty, p.min_qty ?? 0, p.max_qty);
  const muted = selected ? "text-inverse-muted" : "text-fg-muted";

  return (
    <div
      className={`relative h-full rounded-[26px] lg:rounded-4xl p-3.5 lg:p-4 flex flex-col gap-2.5 lg:gap-3 transition-colors duration-200 ${
        selected ? "bg-inverse text-ink shadow-lift" : "bg-surface text-fg hover:bg-[#19243a]"
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <ProductAvatar name={p.name} imageUrl={p.image_url} tone={selected ? "ink" : "surface"} />
        <StatusChip status={p.status} onLight={selected} size="sm" />
      </div>

      {/* O botão cobre o card inteiro (after:inset-0); o ± fica por cima com z-10 */}
      <button
        type="button"
        onClick={onOpen}
        aria-current={selected ? "true" : undefined}
        className="text-left flex flex-col gap-0.5 cursor-pointer after:content-[''] after:absolute after:inset-0 after:rounded-[inherit] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-accent"
      >
        <span className="text-[15px] lg:text-base font-extrabold leading-tight line-clamp-2">{p.name}</span>
        <span className={`text-xs lg:text-[13px] font-bold truncate ${muted}`}>{p.location || p.code}</span>
        {previsao !== null && previsao <= 7 && (
          <span className={`text-xs lg:text-[13px] font-extrabold ${selected ? "text-ink" : previsao < 1 ? "text-zero" : "text-low"}`}>
            {formatPrevisao(previsao)}
          </span>
        )}
      </button>

      <span className={`mt-auto border-t-2 border-dashed ${selected ? "border-ink/15" : "border-white/[0.12]"}`} />

      <div className="flex justify-between items-center gap-2">
        <span className="min-w-0 truncate">
          <span className="text-[22px] lg:text-[26px] font-black">{formatQty(p.qty)}</span>{" "}
          <span className={`text-[13px] lg:text-sm font-extrabold ${muted}`}>{p.unit}</span>
        </span>
        {onMove && (
          <button
            type="button"
            onClick={onMove}
            aria-label={`Registrar entrada ou saída: ${p.name}`}
            className="lg:hidden relative z-10 w-11 h-11 rounded-full bg-surface-2 text-fg flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-white/10"
          >
            <PlusMinusIcon className="w-5 h-5" strokeWidth={2.2} />
          </button>
        )}
        <span className={`hidden lg:inline text-[13px] font-extrabold ${muted}`}>{formatBRL(p.price)}</span>
      </div>

      <div className="hidden lg:block">
        <LevelBar fill={level.fill} status={p.status} onLight={selected} />
      </div>
    </div>
  );
}

export default function EstoquePage() {
  const router  = useRouter();
  const role    = useRole();
  const canEdit = can(role, "canEditEstoque");
  const canNota = can(role, "canAccessNota");

  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState<Filter>("todos");
  const [sort, setSort]             = useState<Sort>("nome");
  const [wsId, setWsId]             = useState<string | undefined>(undefined);
  const [wsName, setWsName]         = useState("");
  const [userName, setUserName]     = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetId, setSheetId]       = useState<string | null>(null);
  const [addOpen, setAddOpen]       = useState(false);
  const [scanning, setScanning]     = useState(false);
  const [toast, setToast]           = useState("");

  /* ── Cache SWR: dados aparecem instantâneo ao voltar para a tela ── */
  const { products, loading, error } = useProducts(wsId);
  const forecast = useForecast(wsId);
  const [now, setNow] = useState(0);
  /* Uma vez ao abrir: depender de `products` entrava em laço enquanto a lista carregava */
  useEffect(() => { setNow(Date.now()); }, []);
  const previsaoDe = (p: Product) => previsaoDias(p.qty, p.created_at, forecast.get(p.id), now);
  /* "Parados" (EQZ-18, Growth e Pro): com estoque e sem saída há 60 dias */
  const { plan } = usePlan();
  const temParados  = !!planInfo(plan)?.parados;
  const ultimaSaida = useLastOutflow(wsId, temParados);
  const parado = (p: Product) => temParados && estaParado(p.qty, p.created_at, ultimaSaida.get(p.id), now);
  const filters = temParados ? [...FILTERS, { id: "parados" as Filter, label: "Parados", dot: "bg-fg-subtle" }] : FILTERS;

  useEffect(() => {
    async function load() {
      const ws = getWorkspace();
      if (!ws) { router.push("/select-workspace"); return; }
      setWsName(ws.name);
      setWsId(ws.id);

      /* Busca vinda da barra superior (/estoque?busca=...) */
      const q = new URLSearchParams(window.location.search).get("busca");
      if (q) setSearch(q);
      /* Card "R$ parados" do painel abre a lista já filtrada */
      if (new URLSearchParams(window.location.search).get("filtro") === "parados") setFilter("parados");

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
        setUserName(profile?.name ?? user.email?.split("@")[0] ?? "");
      }
    }
    load();
  }, [router]);

  const rows: Row[] = useMemo(
    () => products.map((p) => ({ ...p, status: deriveStatus(p.qty, p.min_qty ?? 0) })),
    [products]
  );

  const counts = useMemo(() => {
    const c = { todos: rows.length, normal: 0, baixo: 0, zerado: 0, parados: 0 };
    for (const r of rows) { c[r.status] += 1; if (parado(r)) c.parados += 1; }
    return c;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, ultimaSaida, now, temParados]);

  const totalValue = useMemo(() => rows.reduce((s, r) => s + r.qty * r.price, 0), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter((r) =>
      (filter === "todos" || (filter === "parados" ? parado(r) : r.status === filter)) &&
      (!q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
    );
    if (sort === "menor") list.sort((a, b) => a.qty / Math.max(a.min_qty ?? 0, 1) - b.qty / Math.max(b.min_qty ?? 0, 1));
    if (sort === "valor") list.sort((a, b) => b.qty * b.price - a.qty * a.price);
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search, filter, sort, ultimaSaida, now, temParados]);

  /* No computador, abre o painel já com o primeiro produto da lista */
  useEffect(() => {
    if (selectedId || filtered.length === 0) return;
    if (window.matchMedia(DESKTOP_QUERY).matches) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  const selected     = rows.find((r) => r.id === selectedId) ?? null;
  const sheetProduct = rows.find((r) => r.id === sheetId) ?? null;

  function openProduct(id: string) {
    if (window.matchMedia(DESKTOP_QUERY).matches) setSelectedId(id);
    else router.push(`/estoque/${id}`);
  }

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  }

  /* Atualiza a quantidade na hora (otimista) e revalida produtos, stats e movimentações */
  function applyMovement(product: Row, newQty: number, delta: number) {
    if (!wsId) return;
    mutate(
      ["products", wsId],
      (list?: Product[]) => list?.map((p) => (p.id === product.id ? { ...p, qty: newQty } : p)),
      { revalidate: true }
    );
    mutateStats(wsId);
    mutateMovements(wsId);
    showToast(`${delta > 0 ? "Entrada" : "Saída"} registrada: ${delta > 0 ? "+" : "−"}${formatQty(Math.abs(delta))} ${product.unit}`);
  }

  const handleScanDetect = useCallback((code: string) => {
    setSearch(sanitizeCode(code));
    setFilter("todos");
    setScanning(false);
  }, []);
  const handleScanClose = useCallback(() => setScanning(false), []);

  return (
    <div className="min-h-screen bg-ink">
      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      <main className="lg:pl-64 pt-14 pb-28 lg:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-4 lg:gap-6">

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight leading-tight">Estoque</h1>
              <p className="text-sm lg:text-[15px] font-bold text-fg-muted">
                {loading
                  ? "Carregando…"
                  : <>{rows.length} produto{rows.length !== 1 ? "s" : ""}<span className="hidden lg:inline"> · {formatBRL(totalValue)} em estoque</span></>}
              </p>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              {canNota && (
                <Link href="/nota" className="flex items-center gap-2.5 min-h-[48px] px-5 rounded-full bg-surface text-[15px] font-extrabold hover:bg-surface-2 transition-colors">
                  <DocumentIcon /> Ler nota de compra
                </Link>
              )}
              {canEdit && (
                <Link href="/estoque/importar" className="flex items-center gap-2.5 min-h-[48px] px-5 rounded-full bg-surface text-[15px] font-extrabold hover:bg-surface-2 transition-colors">
                  <UploadIcon /> Importar planilha
                </Link>
              )}
              {canEdit && (
                <Link href="/estoque/novo" className="flex items-center gap-2.5 min-h-[48px] px-[22px] rounded-full bg-accent text-ink text-[15px] font-black hover:brightness-110 transition-[filter]">
                  <PlusIcon strokeWidth={2.6} /> Adicionar produto
                </Link>
              )}
            </div>

            {canEdit && (
              <div className="lg:hidden relative">
                <button
                  type="button"
                  aria-label="Adicionar produto"
                  aria-expanded={addOpen}
                  aria-controls="estoque-add-menu"
                  onClick={() => setAddOpen((o) => !o)}
                  onKeyDown={(e) => { if (e.key === "Escape") setAddOpen(false); }}
                  className={`relative z-30 w-[52px] h-[52px] rounded-full bg-accent text-ink flex items-center justify-center cursor-pointer transition-transform duration-200 ${addOpen ? "rotate-45" : ""}`}
                >
                  <PlusIcon className="w-6 h-6" strokeWidth={2.6} />
                </button>
                {addOpen && (
                  <>
                    <button type="button" aria-label="Fechar menu" tabIndex={-1} onClick={() => setAddOpen(false)} className="fixed inset-0 z-20 cursor-default" />
                    <div
                      id="estoque-add-menu"
                      onKeyDown={(e) => { if (e.key === "Escape") setAddOpen(false); }}
                      className="absolute right-0 top-[60px] z-30 w-60 p-2 rounded-3xl bg-surface-2 shadow-lift flex flex-col"
                    >
                      <Link href="/estoque/novo" className="flex items-center gap-3 min-h-[48px] px-3 rounded-2xl text-[15px] font-extrabold hover:bg-white/10">
                        <PlusIcon /> Adicionar manualmente
                      </Link>
                      {canNota && (
                        <Link href="/nota" className="flex items-center gap-3 min-h-[48px] px-3 rounded-2xl text-[15px] font-extrabold hover:bg-white/10">
                          <DocumentIcon /> Ler nota de compra
                        </Link>
                      )}
                      <Link href="/estoque/importar" className="flex items-center gap-3 min-h-[48px] px-3 rounded-2xl text-[15px] font-extrabold hover:bg-white/10">
                        <UploadIcon /> Importar planilha
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
              {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-[190px] rounded-4xl bg-surface animate-pulse" />)}
            </div>
          ) : error ? (
            <PageError message={error.message} onRetry={() => mutateProducts(wsId!)} />
          ) : (
            <>
              <div className="flex flex-col lg:flex-row lg:items-center gap-3.5 lg:gap-3">
                <div className="flex-1 flex items-center gap-2.5 h-14 lg:h-[52px] pl-[18px] pr-1.5 rounded-full bg-surface focus-within:ring-2 focus-within:ring-accent">
                  <SearchIcon className="w-5 h-5 text-fg-subtle flex-shrink-0" />
                  <input
                    type="search"
                    name="busca"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Buscar produto ou código"
                    placeholder="Buscar produto ou código"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-0 h-full bg-transparent text-fg text-[15px] font-semibold outline-none placeholder:text-fg-subtle"
                  />
                  <button
                    type="button"
                    aria-label="Buscar pelo código de barras"
                    onClick={() => setScanning(true)}
                    className="lg:hidden w-11 h-11 rounded-full bg-surface-2 text-fg flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-white/10"
                  >
                    <ScanIcon />
                  </button>
                </div>

                {/* Celular: abas com sublinhado */}
                <div role="group" aria-label="Filtrar por situação" className="lg:hidden flex gap-5 px-1 overflow-x-auto scrollbar-none">
                  {filters.map((f) => {
                    const active = filter === f.id;
                    const n = f.id === "baixo" || f.id === "zerado" || f.id === "parados" ? counts[f.id] : 0;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFilter(f.id)}
                        className={`min-h-[44px] flex flex-col items-center justify-center gap-1.5 text-base whitespace-nowrap cursor-pointer ${
                          active ? "text-fg font-black" : "text-fg-muted font-extrabold"
                        }`}
                      >
                        {f.label}{n > 0 ? ` · ${n}` : ""}
                        <span className={`w-[18px] h-1 rounded-full ${active ? "bg-accent" : "bg-transparent"}`} />
                      </button>
                    );
                  })}
                </div>

                {/* Computador: pílulas com contagem */}
                <div role="group" aria-label="Filtrar por situação" className="hidden lg:flex gap-1 p-[5px] rounded-full bg-surface">
                  {filters.map((f) => {
                    const active = filter === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFilter(f.id)}
                        className={`flex items-center gap-2 min-h-[42px] pl-3.5 pr-2 rounded-full text-sm cursor-pointer transition-colors duration-200 ${
                          active ? "bg-inverse text-ink font-black" : "text-fg-soft font-extrabold hover:text-fg"
                        }`}
                      >
                        {f.dot && <span className={`w-2 h-2 rounded-full ${f.dot}`} />}
                        {f.label}
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full ${active ? "bg-ink text-fg" : "bg-surface-2 text-fg"}`}>
                          {counts[f.id]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <select
                  aria-label="Ordenar por"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="hidden lg:block h-[52px] px-[18px] rounded-full bg-surface text-fg text-sm font-extrabold cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <option value="nome">Nome (A–Z)</option>
                  <option value="menor">Menor estoque</option>
                  <option value="valor">Maior valor</option>
                </select>
              </div>

              {filtered.length > 0 ? (
                <div className="flex gap-5 items-start">
                  <ul className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(196px,1fr))] gap-3 lg:gap-4">
                    {filtered.map((p) => (
                      <li key={p.id} className="min-w-0">
                        <ProductCard
                          p={p}
                          selected={p.id === selectedId}
                          previsao={previsaoDe(p)}
                          onOpen={() => openProduct(p.id)}
                          onMove={canEdit ? () => setSheetId(p.id) : undefined}
                        />
                      </li>
                    ))}
                  </ul>
                  {selected && (
                    <div className="hidden lg:block w-[360px] xl:w-[380px] flex-shrink-0 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-none rounded-5xl">
                      <ProductPanel
                        product={selected}
                        previsao={previsaoDe(selected)}
                        canEdit={canEdit}
                        onMoved={(newQty, delta) => applyMovement(selected, newQty, delta)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <span className="w-16 h-16 rounded-full bg-surface text-fg-muted flex items-center justify-center">
                    <BoxIcon className="w-7 h-7" />
                  </span>
                  <div>
                    <p className="font-black">Nenhum produto encontrado</p>
                    <p className="text-sm font-bold text-fg-muted mt-1">
                      {rows.length === 0 ? "Cadastre um produto ou importe uma compra para começar." : "Tente outro termo ou filtro."}
                    </p>
                  </div>
                  {rows.length === 0 && canEdit && (
                    <Link href="/estoque/importar" className="min-h-[44px] px-5 flex items-center gap-2 rounded-full bg-surface-2 text-sm font-extrabold hover:bg-white/10">
                      <UploadIcon className="w-4 h-4" /> Já tem uma planilha? Importe
                    </Link>
                  )}
                  {(search || filter !== "todos") && (
                    <button
                      type="button"
                      onClick={() => { setSearch(""); setFilter("todos"); }}
                      className="min-h-[44px] px-5 rounded-full bg-surface-2 text-sm font-extrabold cursor-pointer hover:bg-white/10"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <MovementSheet
        product={sheetProduct}
        onClose={() => setSheetId(null)}
        onDone={(newQty, delta) => {
          if (sheetProduct) applyMovement(sheetProduct, newQty, delta);
          setSheetId(null);
        }}
      />

      {scanning && (
        <BarcodeScanner
          title="Buscar pelo código"
          subtitle="Aponte a câmera para o código de barras do produto"
          onDetect={handleScanDetect}
          onClose={handleScanClose}
        />
      )}

      <div aria-live="polite" className="fixed left-1/2 -translate-x-1/2 bottom-[104px] lg:bottom-8 z-[70] pointer-events-none">
        {toast && (
          <p className="px-5 py-3 rounded-full bg-inverse text-ink text-sm font-black shadow-lift whitespace-nowrap">{toast}</p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
