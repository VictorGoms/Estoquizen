"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";

/* ─── Icons ─── */
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);
const BoxIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const MinusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
  </svg>
);
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);


const ITEM = {
  id: "p1",
  name: "Parafuso Sextavado M8",
  code: "PRF-M8-001",
  category: "Fixadores",
  unit: "un",
  price: 0.45,
  minQty: 50,
  maxQty: 500,
  location: "Prateleira A3",
  supplier: "MetalFix Distribuidora",
  lastMovement: "Hoje, 09:42",
  createdAt: "12/01/2025",
  colorFrom: "rgba(37,99,235,0.5)",
  colorTo: "rgba(29,78,216,0.15)",
};

interface Metric {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  wide?: boolean;
}

export default function ItemDetailPage() {
  const router = useRouter();
  const [qty, setQty] = useState(320);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(ITEM.name);
  const [editPrice, setEditPrice] = useState(String(ITEM.price));
  const [editLocation, setEditLocation] = useState(ITEM.location);

  const status = qty === 0 ? "zerado" : qty <= ITEM.minQty ? "baixo" : "normal";
  const STATUS_CFG = {
    normal:  { label: "Normal",  bg: "rgba(5,150,105,0.15)",  text: "#6EE7B7", dot: "#10B981" },
    baixo:   { label: "Baixo",   bg: "rgba(217,119,6,0.15)",  text: "#FCD34D", dot: "#D97706" },
    zerado:  { label: "Zerado",  bg: "rgba(220,38,38,0.15)",  text: "#FCA5A5", dot: "#EF4444" },
  };
  const st = STATUS_CFG[status];

  const priceNum = parseFloat(editPrice) || ITEM.price;
  const totalValue = (qty * priceNum).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const unitFmt = priceNum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const METRICS: Metric[] = [
    { label: "Quantidade atual",    value: `${qty} ${ITEM.unit}`,          sub: status === "baixo" ? `Mínimo: ${ITEM.minQty}` : undefined },
    { label: "Preço unitário",      value: unitFmt },
    { label: "Estoque mínimo",      value: `${ITEM.minQty} ${ITEM.unit}` },
    { label: "Estoque máximo",      value: `${ITEM.maxQty} ${ITEM.unit}` },
    { label: "Última movimentação", value: ITEM.lastMovement },
    { label: "Cadastrado em",       value: ITEM.createdAt },
    { label: "Valor total em estoque", value: totalValue, highlight: true, wide: true },
  ];

  function handleAdd() {
    setQty((q) => q + 1);
  }
  function handleRemove() {
    setQty((q) => Math.max(0, q - 1));
  }
  function toggleEdit() {
    setEditMode((m) => !m);
  }

  return (
    <div className="min-h-screen bg-navy-900 relative overflow-hidden">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "800px",
          height: "400px",
          background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.10) 0%, transparent 70%)",
        }}
      />

      <DashboardSidebar />
      <DashboardTopBar />

      <main className="lg:pl-64 pt-14 pb-28 lg:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 lg:py-8 flex flex-col gap-6">

            {/* ── Breadcrumb / back ── */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/estoque")}
                className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs font-medium cursor-pointer transition-colors duration-200"
              >
                <ArrowLeftIcon />
                Estoque
              </button>
              <span className="text-slate-700 text-xs">/</span>
              <span className="text-slate-400 text-xs truncate">{editName}</span>
            </div>

            {/* ── Main two-column grid ── */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">

              {/* ── LEFT: Image + actions ── */}
              <div className="flex flex-col gap-5">

                {/* Product image */}
                <div
                  className="w-full rounded-2xl overflow-hidden relative flex items-center justify-center"
                  style={{
                    height: "300px",
                    background: `radial-gradient(ellipse at 50% 60%, ${ITEM.colorFrom} 0%, ${ITEM.colorTo} 60%, rgba(15,23,42,0.3) 100%)`,
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {/* Grid pattern overlay */}
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                      backgroundSize: "24px 24px",
                    }}
                  />
                  <div
                    className="relative z-10 w-24 h-24 rounded-3xl flex items-center justify-center text-white"
                    style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)" }}
                  >
                    <BoxIcon />
                  </div>

                  {/* Status badge */}
                  <span
                    className="absolute top-4 right-4 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5"
                    style={{ background: st.bg, color: st.text }}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: st.dot }} />
                    {st.label}
                  </span>
                </div>

                {/* ── Action buttons ── */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Adicionar */}
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: "rgba(5,150,105,0.12)",
                      border: "1px solid rgba(16,185,129,0.2)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(5,150,105,0.2)"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(5,150,105,0.12)"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.2)"; }}
                  >
                    <span style={{ color: "#6EE7B7" }}><PlusIcon /></span>
                    <span className="text-[11px] font-medium" style={{ color: "#6EE7B7" }}>Adicionar</span>
                  </button>

                  {/* Remover */}
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={qty === 0}
                    className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
                    style={{
                      background: "rgba(220,38,38,0.10)",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                    onMouseEnter={(e) => { if (qty > 0) { e.currentTarget.style.background = "rgba(220,38,38,0.18)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; }}}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.10)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}
                  >
                    <span style={{ color: "#FCA5A5" }}><MinusIcon /></span>
                    <span className="text-[11px] font-medium" style={{ color: "#FCA5A5" }}>Remover</span>
                  </button>

                  {/* Editar */}
                  <button
                    type="button"
                    onClick={toggleEdit}
                    className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: editMode ? "rgba(37,99,235,0.18)" : "rgba(30,41,59,0.8)",
                      border: editMode ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <span style={{ color: editMode ? "#93C5FD" : "#64748B" }}>
                      {editMode ? <CheckIcon /> : <PencilIcon />}
                    </span>
                    <span className="text-[11px] font-medium" style={{ color: editMode ? "#93C5FD" : "#64748B" }}>
                      {editMode ? "Salvar" : "Editar"}
                    </span>
                  </button>
                </div>
              </div>

              {/* ── RIGHT: Info + metrics ── */}
              <div className="flex flex-col gap-5">

                {/* Product identity */}
                <div
                  className="rounded-2xl p-5 flex flex-col gap-4"
                  style={{
                    background: "rgba(22,32,52,0.8)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {editMode ? (
                    /* Edit mode fields */
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wide block mb-1">
                          Nome do produto
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none transition-all duration-200"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(59,130,246,0.4)" }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wide block mb-1">
                            Preço unitário (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none transition-all duration-200"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(59,130,246,0.4)" }}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wide block mb-1">
                            Localização
                          </label>
                          <input
                            type="text"
                            value={editLocation}
                            onChange={(e) => setEditLocation(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none transition-all duration-200"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(59,130,246,0.4)" }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Read mode */
                    <>
                      <div>
                        <h2 className="font-display font-bold text-xl text-white leading-tight">{editName}</h2>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="font-mono text-xs text-slate-600">{ITEM.code}</span>
                          <span
                            className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                            style={{ background: "rgba(37,99,235,0.15)", color: "#93C5FD" }}
                          >
                            {ITEM.category}
                          </span>
                        </div>
                      </div>
                      <div
                        className="flex items-center justify-between pt-4"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <div>
                          <p className="text-[11px] text-slate-600 uppercase tracking-wide font-medium">Fornecedor</p>
                          <p className="text-sm text-slate-300 mt-0.5">{ITEM.supplier}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-slate-600 uppercase tracking-wide font-medium">Localização</p>
                          <p className="text-sm text-slate-300 mt-0.5">{editLocation}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* ── Metrics grid ── */}
                <div className="grid grid-cols-2 gap-3">
                  {METRICS.map((m) => (
                    <div
                      key={m.label}
                      className={`rounded-2xl p-4 flex flex-col gap-1 ${m.wide ? "col-span-2" : ""}`}
                      style={{
                        background: m.highlight
                          ? "rgba(37,99,235,0.12)"
                          : "rgba(22,32,52,0.8)",
                        border: m.highlight
                          ? "1px solid rgba(59,130,246,0.25)"
                          : "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">
                        {m.label}
                      </p>
                      <p
                        className="font-display font-bold text-lg leading-tight"
                        style={{ color: m.highlight ? "#93C5FD" : "#F1F5F9" }}
                      >
                        {m.value}
                      </p>
                      {m.sub && (
                        <p className="text-[10px]" style={{ color: "#FCD34D" }}>{m.sub}</p>
                      )}
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
