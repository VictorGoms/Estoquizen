"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import NotaTopBar from "@/components/nota/NotaTopBar";
import ProductReviewCard, { type ReviewProduct } from "@/components/nota/ProductReviewCard";
import PrimaryButton from "@/components/auth/PrimaryButton";
import SecondaryButton from "@/components/workspace/SecondaryButton";
import { api } from "@/lib/api";
import { getWorkspace } from "@/hooks/useWorkspace";

interface NfceRawItem {
  nome:           string;
  quantidade:     number;
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
      code:      "",
      name:      item.nome,
      unit:      "un",
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

/* ─── Icons ─── */
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);

export default function NotaRevisaoPage() {
  const router  = useRouter();
  const [chave, setChave]       = useState("");
  const [products, setProducts] = useState<ReviewProduct[]>([]);

  useEffect(() => {
    setChave(getChaveFromSession());
    const sessionProducts = loadProductsFromSession();
    setProducts(sessionProducts);

    /* Cruza com o estoque real para atualizar status */
    const ws = getWorkspace();
    if (!ws || sessionProducts.length === 0) return;

    api.get<{ id: string; code: string; name: string; source_name?: string; unit: string; price: number }[]>(
      `/products?workspace_id=${ws.id}`
    ).then((existing) => {
      const byCode       = Object.fromEntries(existing.filter((p) => p.code).map((p) => [p.code, p]));
      const bySourceName = Object.fromEntries(existing.map((p) => [normName(p.source_name ?? p.name), p]));
      setProducts(sessionProducts.map((p) => {
        const match = (p.code ? byCode[p.code] : undefined) ?? bySourceName[normName(p.name)];
        if (!match) return { ...p, status: "novo" as const };
        const divergente = match.unit !== p.unit || Math.abs(match.price - p.unitPrice) > 0.01;
        return { ...p, status: divergente ? "divergente" as const : "existente" as const };
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
      const existing = await api.get<{ id: string; code: string; name: string; source_name?: string }[]>(
        `/products?workspace_id=${ws.id}`
      );
      const byCode       = Object.fromEntries(existing.filter((p) => p.code).map((p) => [p.code, p.id]));
      const bySourceName = Object.fromEntries(existing.map((p) => [normName(p.source_name ?? p.name), p.id]));

      await Promise.all(
        products.map((p) => {
          const existingId = (p.code ? byCode[p.code] : undefined) ?? bySourceName[normName(p.name)];
          if (!existingId) {
            /* Cria produto novo com a quantidade da NF-e */
            return api.post("/products", {
              workspace_id: ws.id,
              name:     p.name,
              code:     p.code,
              unit:     p.unit,
              price:    p.unitPrice,
              qty:      p.qty,
            });
          } else {
            /* Registra entrada no produto existente */
            return api.post(`/products/${existingId}/adjust`, {
              delta:  p.qty,
              reason: `NFC-e ${chave ? chave.slice(0, 8) + "…" : ""}`.trim(),
            });
          }
        })
      );

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
  const totalQty    = products.reduce((s, p) => s + p.qty, 0);
  const totalValue  = products.reduce((s, p) => s + p.qty * p.unitPrice, 0);
  const newCount    = products.filter((p) => p.status === "novo").length;
  const existingCount = products.filter((p) => p.status === "existente").length;
  const divergentCount = products.filter((p) => p.status === "divergente").length;
  const fmtCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen bg-navy-900 relative overflow-hidden">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "1000px", height: "500px",
          background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.10) 0%, transparent 70%)",
        }}
      />

      <DashboardSidebar workspaceName="" userName="" />
      <NotaTopBar title="Revisão da compra" backHref="/nota" />

      {/* Content — extra bottom padding for sticky bar */}
      <main className="lg:pl-60 pt-14 pb-36 md:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 lg:py-8 flex flex-col gap-6 lg:gap-7">

            {/* ── SECTION 1: Header row ── */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-brand-400 text-xs font-semibold uppercase tracking-widest mb-1">Revisão</p>
                <h1 className="font-display font-bold text-xl sm:text-2xl text-white">Confirmar importação</h1>
                <p className="text-slate-400 text-sm mt-1">
                  Verifique os produtos e quantidades antes de confirmar a entrada.
                </p>
              </div>

              {/* NF-e meta chip */}
              <div
                className="rounded-xl px-4 py-3 flex-shrink-0 sm:text-right"
                style={{
                  background: "rgba(30,41,59,0.6)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  minWidth: "200px",
                }}
              >
                <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium mb-1.5">Documento</p>
                <p className="font-display font-semibold text-white text-sm">NFC-e</p>
                <p className="font-mono text-[9px] text-slate-700 mt-1.5 truncate">{chave || "—"}</p>
              </div>
            </div>

            {/* Alerts */}
            {divergentCount > 0 && !confirmed && (
              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3.5"
                style={{ background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.25)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-amber-300">
                    {divergentCount} {divergentCount === 1 ? "produto com divergência" : "produtos com divergência"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Esses itens já existem no estoque com preço ou unidade diferente da nota. Revise antes de confirmar.
                  </p>
                </div>
              </div>
            )}

            {confirmError && (
              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3.5"
                style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <p className="text-xs text-red-300">{confirmError}</p>
              </div>
            )}

            {confirmed && (
              <div
                className="flex items-center gap-3 rounded-xl px-5 py-4"
                style={{ background: "rgba(5,150,105,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#059669,#10B981)" }}>
                  <CheckIcon />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-300">Nota importada com sucesso!</p>
                  <p className="text-xs text-slate-500 mt-0.5">Redirecionando para o estoque…</p>
                </div>
              </div>
            )}

            {/* ── SECTION 2: Summary cards (horizontal) ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Itens",           value: String(totalItems),          sub: "produtos",   color: undefined },
                { label: "Quantidade",      value: String(totalQty),            sub: "unidades",   color: undefined },
                { label: "Valor total",     value: fmtCurrency(totalValue),     sub: "na NF-e",    color: undefined },
                { label: "Novos",           value: String(newCount),            sub: "produtos",   color: "#60A5FA" },
                { label: "Cadastrados",     value: String(existingCount),       sub: "produtos",   color: "#6EE7B7" },
                { label: "Divergências",    value: String(divergentCount),      sub: "produtos",   color: divergentCount > 0 ? "#FCD34D" : undefined },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl px-3 py-3 text-center"
                  style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <p className="text-[9px] text-slate-600 uppercase tracking-wider font-medium mb-1">{s.label}</p>
                  <p
                    className="font-display font-bold text-lg leading-none"
                    style={{ color: s.color ?? "#F1F5F9" }}
                  >
                    {s.value}
                  </p>
                  <p className="text-[9px] text-slate-700 mt-1">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* ── SECTION 3: Product list ── */}
            <div>
              {/* List header */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium">
                  {totalItems} {totalItems === 1 ? "produto" : "produtos"}
                </p>

                {/* Edit mode toggle */}
                {!confirmed && products.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setEditMode((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
                    style={
                      editMode
                        ? { background: "rgba(217,119,6,0.15)", color: "#FCD34D", border: "1px solid rgba(217,119,6,0.25)" }
                        : { background: "rgba(255,255,255,0.05)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.08)" }
                    }
                  >
                    {editMode ? <><XIcon /> Fechar edição</> : <><PencilIcon /> Editar</>}
                  </button>
                )}
              </div>

              {/* Desktop column headers (read or edit mode) */}
              {products.length > 0 && (
                <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto] px-4 mb-1.5">
                  <span className="text-[10px] text-slate-700 uppercase tracking-wider font-medium">Produto</span>
                  <span className="text-[10px] text-slate-700 uppercase tracking-wider font-medium w-32 text-center">Quantidade</span>
                  <span className="text-[10px] text-slate-700 uppercase tracking-wider font-medium w-[120px] text-right pr-1">Total</span>
                </div>
              )}

              {/* Empty state */}
              {products.length === 0 ? (
                <div
                  className="rounded-2xl flex flex-col items-center justify-center gap-3 py-14 text-center"
                  style={{ background: "rgba(30,41,59,0.4)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm text-slate-600">Nenhum produto na lista</p>
                  <button type="button" onClick={() => router.push("/nota")}
                    className="text-xs text-brand-400 hover:text-brand-300 transition-colors cursor-pointer">
                    Voltar e buscar outra nota
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {products.map((p) => (
                    <ProductReviewCard
                      key={p.id}
                      product={p}
                      editMode={editMode}
                      onQtyChange={handleQtyChange}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              )}

              {/* Edit-mode hint */}
              {editMode && products.length > 0 && (
                <p className="text-[10px] text-slate-700 mt-3 text-center">
                  Toque no número para digitar uma quantidade exata. Remova itens com o ícone de lixeira.
                </p>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* ── SECTION 4: Sticky bottom action bar ── */}
      {!confirmed && (
        <div
          className="fixed bottom-0 left-0 lg:left-60 right-0 z-40"
          style={{
            background: "rgba(13,19,35,0.97)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Mobile bottom nav clearance handled by pb-28 on mobile, the bar sits above it */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
            {/* Left: meta */}
            <div className="hidden sm:flex flex-col">
              <p className="text-xs font-semibold text-white leading-none">{fmtCurrency(totalValue)}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{totalItems} produtos · {totalQty} unidades</p>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <SecondaryButton
                onClick={() => router.push("/nota")}
                icon={<BackIcon />}
                disabled={loading}
                className="flex-1 sm:flex-none sm:w-40"
              >
                Cancelar
              </SecondaryButton>

              <PrimaryButton
                onClick={handleConfirm}
                loading={loading}
                disabled={products.length === 0}
                className="flex-1 sm:flex-none sm:w-52"
              >
                {!loading && <CheckIcon />}
                Confirmar entrada
              </PrimaryButton>
            </div>
          </div>

          {/* Mobile: extra space so bottom nav doesn't overlap */}
          <div className="md:hidden h-16" />
        </div>
      )}

      <BottomNav />
    </div>
  );
}
