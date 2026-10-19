"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import BottomNav from "@/components/dashboard/BottomNav";
import ProductReviewCard, { type ReviewProduct } from "@/components/nota/ProductReviewCard";
import { ArrowLeftIcon, BoxIcon, CheckIcon, PencilIcon, Spinner } from "@/components/ui/icons";
import { api } from "@/lib/api";
import { getWorkspace } from "@/hooks/useWorkspace";
import { formatBRL } from "@/lib/stock";

interface NfceRawItem {
  nome:           string;
  quantidade:     number;
  unidade:        string;
  codigo:         string;
  valor_unitario: number;
}

function loadProductsFromSession(): ReviewProduct[] {
  try {
    const raw  = sessionStorage.getItem("nf_items");
    const tipo = sessionStorage.getItem("nf_tipo");
    if (!raw) return [];
    const items = JSON.parse(raw);

    /* XML já vem com todos os campos mapeados */
    if (tipo === "xml") return items as ReviewProduct[];

    /* NFC-e vem com campos do scraper */
    return (items as NfceRawItem[]).map((item, i) => ({
      id:        `nf-${i}`,
      code:      item.codigo ?? "",
      name:      item.nome,
      unit:      item.unidade ?? "un",
      qty:       item.quantidade,
      unitPrice: item.valor_unitario,
      status:    "novo" as const,
    }));
  } catch {
    return [];
  }
}

function getChaveFromSession(): string {
  try { return sessionStorage.getItem("nf_chave") ?? ""; } catch { return ""; }
}

/* Normaliza nome para match aproximado: minúsculas, sem acento, sem pontuação extra */
function normName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function NotaRevisaoPage() {
  const router  = useRouter();
  const [chave, setChave]       = useState("");
  const [tipo, setTipo]         = useState("");
  const [wsName, setWsName]     = useState("");
  const [products, setProducts] = useState<ReviewProduct[]>([]);

  useEffect(() => {
    setChave(getChaveFromSession());
    try { setTipo(sessionStorage.getItem("nf_tipo") ?? ""); } catch { /* sem sessionStorage */ }
    const sessionProducts = loadProductsFromSession();
    setProducts(sessionProducts);

    /* Cruza com o estoque real para atualizar status */
    const ws = getWorkspace();
    if (ws) setWsName(ws.name);
    if (!ws || sessionProducts.length === 0) return;

    api.get<{ id: string; code: string; name: string; source_name?: string; unit: string; price: number }[]>(
      `/products?workspace_id=${ws.id}`
    ).then((existing) => {
      const byCode       = Object.fromEntries(existing.filter((p) => p.code).map((p) => [p.code, p]));
      const bySourceName = Object.fromEntries(existing.map((p) => [normName(p.source_name ?? p.name), p]));
      setProducts(sessionProducts.map((p) => {
        const match = (p.code ? byCode[p.code] : undefined) ?? bySourceName[normName(p.name)];
        if (!match) return { ...p, status: "novo" as const };
        const outraUnidade = match.unit.toLowerCase() !== p.unit.toLowerCase();
        const divergente   = outraUnidade || Math.abs(match.price - p.unitPrice) > 0.01;
        return {
          ...p,
          status:    divergente ? "divergente" as const : "existente" as const,
          stockUnit: outraUnidade ? match.unit : undefined,
        };
      }));
    }).catch(() => { /* mantém status "novo" se falhar */ });
  }, []);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  function handleQtyChange(id: string, qty: number) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, qty } : p)));
  }
  function handleRemove(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }
  async function handleConfirm() {
    const ws = getWorkspace();
    if (!ws) { setConfirmError("Nenhum workspace selecionado."); return; }

    setLoading(true);
    setConfirmError("");

    try {
      /* Busca produtos existentes para cruzar por código ou nome */
      const existing = await api.get<{ id: string; code: string; name: string; source_name?: string; unit: string }[]>(
        `/products?workspace_id=${ws.id}`
      );
      const unitById     = new Map(existing.map((p) => [p.id, p.unit]));
      const byCode       = new Map(existing.filter((p) => p.code).map((p) => [p.code, p.id]));
      const bySourceName = new Map(existing.map((p) => [normName(p.source_name ?? p.name), p.id]));

      type ImportItem = { product_id?: string; name: string; code?: string; unit: string; price?: number; qty: number };
      const itens: ImportItem[] = [];
      /* A mesma nota pode trazer o mesmo produto novo em duas linhas: vira um produto só */
      const novosPorNome = new Map<string, ImportItem>();

      for (const p of products) {
        const key        = normName(p.name);
        const existingId = (p.code ? byCode.get(p.code) : undefined) ?? bySourceName.get(key);
        const base       = { name: p.name, code: p.code || undefined, unit: p.unit, price: p.unitPrice, qty: p.qty };

        if (existingId) {
          /* Unidade diferente (nota em "un", estoque em "kg"): a quantidade já foi conferida na
             unidade do estoque e o preço da nota não vale para ela, então o preço não muda */
          const stockUnit = unitById.get(existingId);
          const outra     = stockUnit && stockUnit.toLowerCase() !== p.unit.toLowerCase();
          itens.push(outra
            ? { ...base, unit: stockUnit, price: undefined, product_id: existingId }
            : { ...base, product_id: existingId });
        } else if (novosPorNome.has(key)) {
          novosPorNome.get(key)!.qty += p.qty;
        } else {
          novosPorNome.set(key, base);
          itens.push(base);
        }
      }

      /* A API importa tudo numa transação e recusa a mesma nota de novo (409) */
      await api.post("/nfe/importar", {
        workspace_id: ws.id,
        tipo:  tipo === "xml" ? "xml" : "nfce",
        chave: chave || null,
        itens,
      });

      try {
        sessionStorage.removeItem("nf_items");
        sessionStorage.removeItem("nf_chave");
      } catch { /* sem sessionStorage */ }
      setConfirmed(true);
      setTimeout(() => router.push("/estoque"), 1800);
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : "Erro ao confirmar entrada");
    } finally {
      setLoading(false);
    }
  }

  /* Computed */
  const totalItems  = products.length;
  const totalValue  = products.reduce((s, p) => s + p.qty * p.unitPrice, 0);
  const newCount    = products.filter((p) => p.status === "novo").length;
  const existingCount = products.filter((p) => p.status === "existente").length;
  const divergentCount = products.filter((p) => p.status === "divergente").length;
  const docLabel = tipo === "xml" ? "NF-e (XML)" : "NFC-e";

  return (
    <div className="min-h-screen bg-ink">
      <DashboardSidebar workspaceName={wsName} />
      <DashboardTopBar  workspaceName={wsName} />

      {/* Espaço extra embaixo para a barra de confirmação (e, no celular, o menu) */}
      <main className="lg:pl-64 pt-14 pb-[200px] lg:pb-36">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5">

          <Link href="/nota" className="w-fit flex items-center gap-2 min-h-[40px] pl-3 pr-4 rounded-full bg-surface text-sm text-fg font-extrabold hover:bg-surface-2 transition-colors">
            <ArrowLeftIcon className="w-4 h-4" strokeWidth={2.4} /> Ler nota de compra
          </Link>

          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight leading-tight">Confirmar importação</h1>
            <p className="text-sm lg:text-[15px] font-bold text-fg-muted">Confira produtos e quantidades. Nada entra no estoque antes de você confirmar.</p>
          </div>

          {/* ── Resumo ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-3 lg:gap-4">
            <div className="bg-accent text-ink rounded-5xl p-5 lg:p-6 flex flex-col gap-2 min-w-0">
              <p className="flex items-center justify-between gap-3 text-sm font-extrabold text-ink/70">
                <span>Valor total da nota</span>
                <span className="px-2.5 py-1 rounded-full bg-ink/10 text-[12px] font-black text-ink">{docLabel}</span>
              </p>
              <p className="text-[32px] lg:text-[36px] font-black tracking-tight leading-none tabular-nums">{formatBRL(totalValue)}</p>
              <p className="text-[13px] font-bold text-ink/70 truncate" title={chave || undefined}>
                {totalItems} {totalItems === 1 ? "produto" : "produtos"}{chave ? ` · chave ${chave.slice(0, 4)}…${chave.slice(-4)}` : ""}
              </p>
            </div>
            <dl className="bg-surface rounded-5xl p-5 lg:p-6 grid grid-cols-3 gap-3">
              {[
                { label: "Novos",        value: newCount,       dot: "bg-accent", hint: "serão cadastrados" },
                { label: "Cadastrados",  value: existingCount,  dot: "bg-ok",     hint: "recebem entrada" },
                { label: "Divergências", value: divergentCount, dot: "bg-low",    hint: "preço ou unidade" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-1.5 min-w-0">
                  <dt className="flex items-center gap-1.5 text-[13px] font-extrabold text-fg-muted">
                    <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.dot}`} />
                    <span className="truncate">{s.label}</span>
                  </dt>
                  <dd className={`text-[28px] font-black leading-none tabular-nums ${s.label === "Divergências" && s.value > 0 ? "text-low" : ""}`}>{s.value}</dd>
                  <dd className="text-[12px] font-bold text-fg-subtle leading-tight">{s.hint}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ── Avisos ── */}
          {divergentCount > 0 && !confirmed && (
            <p className="flex items-start gap-3 p-4 rounded-4xl bg-low/10 text-sm font-bold text-fg-soft leading-relaxed">
              <span aria-hidden="true" className="w-2.5 h-2.5 mt-1.5 rounded-full bg-low flex-shrink-0" />
              <span>
                <strong className="text-low font-black">
                  {divergentCount} {divergentCount === 1 ? "produto com divergência" : "produtos com divergência"}.
                </strong>{" "}
                Já existem no estoque com preço ou unidade diferente da nota. Ao confirmar, a quantidade entra e o preço passa a ser o da nota.
              </span>
            </p>
          )}

          {confirmError && (
            <p role="alert" className="px-4 py-3 rounded-3xl bg-zero/10 text-zero text-sm font-bold leading-relaxed">{confirmError}</p>
          )}

          {confirmed && (
            <div role="status" className="flex items-center gap-3.5 p-4 rounded-4xl bg-ok/10">
              <span className="w-10 h-10 rounded-full bg-ok text-ink flex items-center justify-center flex-shrink-0">
                <CheckIcon className="w-5 h-5" strokeWidth={3} />
              </span>
              <div>
                <p className="text-[15px] font-black text-ok">Nota importada!</p>
                <p className="text-[13px] font-bold text-fg-muted">Voltando para o estoque…</p>
              </div>
            </div>
          )}

          {/* ── Produtos ── */}
          <section aria-labelledby="rev-lista" className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 id="rev-lista" className="text-lg font-black">
                {totalItems} {totalItems === 1 ? "produto" : "produtos"} na nota
              </h2>
              {!confirmed && products.length > 0 && (
                <button
                  type="button"
                  aria-pressed={editMode}
                  onClick={() => setEditMode((v) => !v)}
                  className={`flex items-center gap-2 min-h-[40px] px-4 rounded-full text-sm cursor-pointer transition-colors ${
                    editMode ? "bg-inverse text-ink font-black" : "bg-surface text-fg font-extrabold hover:bg-surface-2"
                  }`}
                >
                  {editMode ? <CheckIcon className="w-4 h-4" strokeWidth={2.8} /> : <PencilIcon className="w-4 h-4" strokeWidth={2.4} />}
                  {editMode ? "Concluir edição" : "Editar"}
                </button>
              )}
            </div>

            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-14 px-6 text-center bg-surface rounded-5xl">
                <span className="w-14 h-14 rounded-full bg-surface-2 text-fg-muted flex items-center justify-center">
                  <BoxIcon className="w-7 h-7" />
                </span>
                <div>
                  <p className="text-lg font-black">Nenhum produto na lista</p>
                  <p className="text-sm font-bold text-fg-muted mt-1">A nota não trouxe itens ou todos foram removidos.</p>
                </div>
                <Link href="/nota" className="min-h-[44px] px-5 flex items-center rounded-full bg-surface-2 text-sm font-extrabold hover:bg-white/10 transition-colors">
                  Buscar outra nota
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {products.map((p) => (
                  <ProductReviewCard
                    key={p.id}
                    product={p}
                    editMode={editMode}
                    onQtyChange={handleQtyChange}
                    onRemove={handleRemove}
                  />
                ))}
              </ul>
            )}

            {editMode && products.length > 0 && (
              <p className="text-[13px] font-bold text-fg-subtle text-center">
                Toque no número para digitar a quantidade exata. A lixeira tira o item da importação.
              </p>
            )}
          </section>
        </div>
      </main>

      {/* ── Barra de confirmação (acima do menu no celular) ── */}
      {!confirmed && (
        <div className="fixed inset-x-0 lg:left-64 bottom-[calc(96px+env(safe-area-inset-bottom))] lg:bottom-6 z-30 pointer-events-none">
          <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8">
            <div className="pointer-events-auto flex items-center gap-2.5 p-2 rounded-[30px] bg-surface-2 shadow-nav">
              <div className="hidden sm:flex flex-col pl-4 mr-auto min-w-0">
                <p className="text-[15px] font-black tabular-nums leading-tight">{formatBRL(totalValue)}</p>
                <p className="text-[13px] font-bold text-fg-muted leading-tight">{totalItems} {totalItems === 1 ? "produto" : "produtos"}</p>
              </div>
              <Link
                href="/nota"
                aria-disabled={loading}
                className={`flex-1 sm:flex-none sm:w-36 min-h-[52px] flex items-center justify-center rounded-full bg-surface text-[15px] font-extrabold hover:bg-[#19243a] transition-colors ${loading ? "pointer-events-none opacity-50" : ""}`}
              >
                Cancelar
              </Link>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading || products.length === 0}
                className="flex-[1.6] sm:flex-none sm:w-60 min-h-[52px] flex items-center justify-center gap-2 rounded-full bg-accent text-ink text-[15px] font-black cursor-pointer hover:brightness-110 transition-[filter] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Spinner /> : <CheckIcon strokeWidth={2.8} />}
                {loading ? "Importando…" : "Confirmar entrada"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
