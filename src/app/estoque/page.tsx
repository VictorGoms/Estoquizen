"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import PageLoader from "@/components/ui/PageLoader";
import PageError from "@/components/ui/PageError";
import { supabase } from "@/lib/supabase";
import { getWorkspace } from "@/hooks/useWorkspace";

/* ─── Icons ─── */
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const BoxIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

type StockStatus = "normal" | "baixo" | "zerado";

interface Product {
  id: string;
  name: string;
  code: string;
  qty: number;
  min_qty: number;
  unit: string;
  price: number;
  status: StockStatus;
  image_url: string | null;
}

const STATUS_CONFIG: Record<StockStatus, { label: string; bg: string; text: string; dot: string }> = {
  normal:  { label: "Normal",     bg: "rgba(5,150,105,0.15)",  text: "#6EE7B7", dot: "#10B981" },
  baixo:   { label: "Baixo",      bg: "rgba(217,119,6,0.15)",  text: "#FCD34D", dot: "#D97706" },
  zerado:  { label: "Zerado",     bg: "rgba(220,38,38,0.15)",  text: "#FCA5A5", dot: "#EF4444" },
};

const CARD_COLORS = [
  { from: "rgba(37,99,235,0.4)",  to: "rgba(29,78,216,0.15)"  },
  { from: "rgba(5,150,105,0.4)",  to: "rgba(4,120,87,0.15)"   },
  { from: "rgba(124,58,237,0.4)", to: "rgba(109,40,217,0.15)" },
  { from: "rgba(14,165,233,0.4)", to: "rgba(2,132,199,0.15)"  },
  { from: "rgba(236,72,153,0.4)", to: "rgba(190,24,93,0.15)"  },
  { from: "rgba(20,184,166,0.4)", to: "rgba(15,118,110,0.15)" },
];

const FILTERS = [
  { id: "todos",  label: "Todos" },
  { id: "normal", label: "Normal" },
  { id: "baixo",  label: "Baixo" },
  { id: "zerado", label: "Zerado" },
];

function deriveStatus(qty: number, minQty: number): StockStatus {
  if (qty === 0)        return "zerado";
  if (qty <= minQty)    return "baixo";
  return "normal";
}

export default function EstoquePage() {
  const router = useRouter();
  const [search, setSearch]         = useState("");
  const [activeFilter, setActiveFilter] = useState("todos");
  const [products, setProducts]     = useState<Product[]>([]);
  const [wsName, setWsName]         = useState("");
  const [userName, setUserName]     = useState("");
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [fabOpen, setFabOpen]       = useState(false);

  useEffect(() => {
    async function load() {
      const ws = getWorkspace();
      if (!ws) { router.push("/select-workspace"); return; }
      setWsName(ws.name);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .single();
        setUserName(profile?.name ?? user.email?.split("@")[0] ?? "");
      }

      const { data, error: err } = await supabase
        .from("products")
        .select("id, name, code, qty, min_qty, unit, price, image_url")
        .eq("workspace_id", ws.id)
        .order("name");

      if (err) { setError(err.message); setLoading(false); return; }

      setProducts(
        (data ?? []).map((p) => ({
          ...p,
          price:     Number(p.price),
          status:    deriveStatus(p.qty, p.min_qty ?? 0),
          image_url: p.image_url ?? null,
        }))
      );
      setLoading(false);
    }
    load();
  }, [router]);

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === "todos" || p.status === activeFilter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen bg-navy-900 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "800px",
          height: "400px",
          background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.10) 0%, transparent 70%)",
        }}
      />

      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      <main className="lg:pl-60 pt-14 pb-28 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 lg:py-8 flex flex-col gap-6">

            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display font-bold text-xl text-white">Estoque</h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  {loading ? "Carregando…" : `${products.length} produto${products.length !== 1 ? "s" : ""} cadastrado${products.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/estoque/novo")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "rgba(30,41,59,0.8)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#94A3B8",
                  }}
                >
                  <PlusIcon />
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/nota")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                    boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
                  }}
                >
                  <PlusIcon />
                  Via NF-e
                </button>
              </div>
            </div>

            {loading ? (
              <PageLoader />
            ) : error ? (
              <PageError message={error} onRetry={() => { setError(""); setLoading(true); }} />
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                      <SearchIcon />
                    </span>
                    <input
                      type="text"
                      placeholder="Buscar produto ou código..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
                      style={{
                        background: "rgba(30,41,59,0.7)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                      onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                    />
                  </div>

                  <div className="flex gap-2 overflow-x-auto scrollbar-none">
                    {FILTERS.map((f) => {
                      const active = activeFilter === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setActiveFilter(f.id)}
                          className="flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200"
                          style={{
                            background: active ? "rgba(37,99,235,0.2)" : "rgba(30,41,59,0.7)",
                            border: active ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
                            color: active ? "#93C5FD" : "#64748B",
                          }}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {filtered.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((product, i) => {
                      const st = STATUS_CONFIG[product.status];
                      const color = CARD_COLORS[i % CARD_COLORS.length];
                      const total = (product.qty * product.price).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      });
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => router.push(`/estoque/${product.id}`)}
                          className="group text-left rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 flex items-center gap-3 p-3"
                          style={{
                            background: "rgba(22,32,52,0.8)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)";
                            e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(59,130,246,0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.25)";
                          }}
                        >
                          <div
                            className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden relative flex items-center justify-center"
                            style={{
                              background: product.image_url
                                ? "rgba(15,23,42,0.6)"
                                : `radial-gradient(ellipse at 50% 60%, ${color.from} 0%, ${color.to} 70%, rgba(15,23,42,0.4) 100%)`,
                            }}
                          >
                            {product.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="relative z-10 flex items-center justify-center text-white" style={{ width: 28, height: 28 }}>
                                <BoxIcon />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors duration-200 leading-snug truncate">
                                {product.name}
                              </p>
                              <span
                                className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                                style={{ background: st.bg, color: st.text }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                                {st.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-slate-600">{product.code}</span>
                            </div>

                            <div className="flex items-center justify-between mt-0.5">
                              <div className="flex items-baseline gap-1">
                                <span className="font-display font-bold text-base text-white">{product.qty}</span>
                                <span className="text-[11px] text-slate-600">{product.unit}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-600">{total}</span>
                                <span className="text-slate-700 group-hover:text-brand-400 transition-colors duration-200">
                                  <ChevronRightIcon />
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <BoxIcon />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-medium text-sm">Nenhum produto encontrado</p>
                      <p className="text-slate-600 text-xs mt-1">
                        {products.length === 0 ? "Importe uma compra para adicionar produtos" : "Tente outro termo ou filtro"}
                      </p>
                    </div>
                    {(search || activeFilter !== "todos") && (
                      <button
                        type="button"
                        onClick={() => { setSearch(""); setActiveFilter("todos"); }}
                        className="text-xs text-brand-400 hover:text-brand-300 cursor-pointer transition-colors duration-200"
                      >
                        Limpar filtros
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </main>

      {/* ── Mobile FAB speed dial ── */}
      <div className="sm:hidden fixed bottom-20 right-4 z-30 flex flex-col items-end gap-3">
        {/* Speed dial options */}
        {fabOpen && (
          <>
            <button
              type="button"
              onClick={() => { setFabOpen(false); router.push("/estoque/novo"); }}
              className="flex items-center gap-2 cursor-pointer transition-all duration-200 active:scale-95"
              aria-label="Adicionar manualmente"
            >
              <span
                className="text-xs font-semibold text-white px-3 py-1.5 rounded-xl"
                style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Adicionar manualmente
              </span>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#059669,#047857)", boxShadow: "0 4px 16px rgba(5,150,105,0.45)" }}
              >
                <PlusIcon />
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setFabOpen(false); router.push("/nota"); }}
              className="flex items-center gap-2 cursor-pointer transition-all duration-200 active:scale-95"
              aria-label="Importar compra"
            >
              <span
                className="text-xs font-semibold text-white px-3 py-1.5 rounded-xl"
                style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Importar compra
              </span>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", boxShadow: "0 4px 16px rgba(37,99,235,0.45)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </button>
          </>
        )}

        {/* Main FAB */}
        <button
          type="button"
          onClick={() => setFabOpen((o) => !o)}
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white cursor-pointer transition-all duration-200 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
            boxShadow: "0 4px 20px rgba(37,99,235,0.5)",
            transform: fabOpen ? "rotate(45deg)" : "rotate(0deg)",
          }}
          aria-label={fabOpen ? "Fechar menu" : "Adicionar produto"}
        >
          <PlusIcon />
        </button>
      </div>

      {/* Backdrop to close fab */}
      {fabOpen && (
        <div
          className="sm:hidden fixed inset-0 z-20"
          onClick={() => setFabOpen(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}
