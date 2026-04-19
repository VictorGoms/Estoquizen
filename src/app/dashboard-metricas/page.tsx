"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import PageLoader from "@/components/ui/PageLoader";
import PageError from "@/components/ui/PageError";
import { supabase } from "@/lib/supabase";
import { getWorkspace } from "@/hooks/useWorkspace";
import { api } from "@/lib/api";

/* ─── Icons ─── */
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

/* ─── Types ─── */
interface Product {
  id: string;
  name: string;
  qty: number;
  price: number;
  min_qty: number;
}

interface DayPoint {
  date: string;
  dateKey: string;
  entradas: number;
  saidas: number;
}

interface ProductResult {
  id: string;
  name: string;
  qty: number;
  price: number;
  min_qty: number;
  entradas: number;
  saidas: number;
  chartData: DayPoint[];
}

/* ─── Constants ─── */
const PERIODS = [
  { id: "7",  label: "Últimos 7 dias",  days: 7  },
  { id: "30", label: "Últimos 30 dias", days: 30 },
  { id: "90", label: "Últimos 3 meses", days: 90 },
];

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ─── Custom chart tooltip ─── */
function MovTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(10,18,35,0.95)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "10px",
      padding: "10px 14px",
      fontSize: "12px",
      color: "#F1F5F9",
    }}>
      <p style={{ color: "#64748B", fontSize: "11px", marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value} un</strong>
        </p>
      ))}
    </div>
  );
}

/* ─── Page ─── */
export default function DashboardMetricasPage() {
  const router = useRouter();

  const [wsName, setWsName]     = useState("");
  const [userName, setUserName] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedPeriod, setSelectedPeriod]   = useState("30");
  const [result, setResult]     = useState<ProductResult | null>(null);
  const [filtering, setFiltering] = useState(false);

  useEffect(() => {
    async function load() {
      const ws = getWorkspace();
      if (!ws) { router.push("/select-workspace"); return; }
      setWsName(ws.name);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
        setUserName(profile?.name ?? user.email?.split("@")[0] ?? "");
      }

      const { data, error: err } = await supabase
        .from("products")
        .select("id, name, qty, price, min_qty")
        .eq("workspace_id", ws.id)
        .order("name");

      if (err) { setError(err.message); setLoading(false); return; }
      setProducts((data ?? []).map((p) => ({ ...p, price: Number(p.price) })));
      setLoading(false);
    }
    load();
  }, [router]);

  /* ─── Derived ─── */
  const totalProdutos = products.length;
  const valorTotal    = products.reduce((acc, p) => acc + p.qty * p.price, 0);
  const alertasAtivos = products.filter((p) => p.qty < 10).length;

  const alertProducts = [...products].filter((p) => p.qty < 10).sort((a, b) => a.qty - b.qty);
  const qtdZerado = products.filter((p) => p.qty === 0).length;
  const qtdBaixo  = products.filter((p) => p.qty > 0 && p.qty < 10).length;
  const qtdNormal = products.filter((p) => p.qty >= 10).length;
  const xAxisInterval = selectedPeriod === "7" ? 0 : selectedPeriod === "30" ? 3 : 12;

  /* ─── Filter ─── */
  async function handleFilter() {
    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    setFiltering(true);
    const period = PERIODS.find((p) => p.id === selectedPeriod)!;
    const since  = new Date(Date.now() - period.days * 24 * 60 * 60 * 1000).toISOString();

    const movements = await api
      .get<{ delta: number; created_at: string }[]>(
        `/products/${product.id}/movements?since=${encodeURIComponent(since)}`
      )
      .catch(() => [] as { delta: number; created_at: string }[]);

    const deltas   = movements.map((m) => m.delta);
    const entradas = deltas.filter((d) => d > 0).reduce((s, d) => s + d, 0);
    const saidas   = deltas.filter((d) => d < 0).reduce((s, d) => s + Math.abs(d), 0);

    /* Group by day */
    const dayMap = new Map<string, { entradas: number; saidas: number }>();
    for (const m of movements) {
      const key = m.created_at.slice(0, 10);
      const cur = dayMap.get(key) ?? { entradas: 0, saidas: 0 };
      if (m.delta > 0) cur.entradas += m.delta;
      else             cur.saidas   += Math.abs(m.delta);
      dayMap.set(key, cur);
    }

    /* Fill missing days so x-axis is continuous */
    const chartData: DayPoint[] = [];
    for (let i = period.days - 1; i >= 0; i--) {
      const d     = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key   = d.toISOString().slice(0, 10);
      const day   = d.getDate().toString().padStart(2, "0");
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const agg   = dayMap.get(key) ?? { entradas: 0, saidas: 0 };
      chartData.push({ date: `${day}/${month}`, dateKey: key, ...agg });
    }

    setResult({ ...product, entradas, saidas, chartData });
    setFiltering(false);
  }

  const periodDays = PERIODS.find((p) => p.id === selectedPeriod)?.days ?? 30;
  const weeks  = periodDays / 7;
  const months = periodDays / 30;

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-navy-900 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "700px",
          height: "350px",
          background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.09) 0%, transparent 70%)",
        }}
      />

      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      <main className="lg:pl-60 pt-14 pb-28 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 lg:py-10 flex flex-col gap-8 lg:gap-10">

            {/* Breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs font-medium cursor-pointer transition-colors duration-200"
              >
                <ArrowLeftIcon />
                Dashboard
              </button>
              <span className="text-slate-700 text-xs">/</span>
              <span className="text-slate-400 text-xs">Métricas</span>
            </div>

            <div>
              <h1 className="font-display font-bold text-2xl text-white">Métricas</h1>
              <p className="text-slate-500 text-sm mt-1">Visualize dados do seu estoque</p>
            </div>

            {loading ? (
              <PageLoader />
            ) : error ? (
              <PageError message={error} onRetry={() => { setError(""); setLoading(true); }} />
            ) : (
              <>
                {/* ── KPI cards ── */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Total de produtos", value: String(totalProdutos), color: "#93C5FD", bg: "rgba(29,78,216,0.12)"  },
                    { label: "Valor em estoque",  value: fmt(valorTotal),       color: "#6EE7B7", bg: "rgba(5,150,105,0.12)"  },
                    { label: "Alertas ativos",    value: String(alertasAtivos), color: "#FCD34D", bg: "rgba(217,119,6,0.12)"  },
                  ].map((k) => (
                    <div
                      key={k.label}
                      className="rounded-2xl p-4 lg:p-5 flex flex-col gap-2"
                      style={{ background: k.bg, border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <p className="text-[11px] text-slate-500 font-medium leading-tight">{k.label}</p>
                      <p className="font-display font-bold text-lg lg:text-2xl leading-tight" style={{ color: k.color }}>
                        {k.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* ── Produtos em Alerta ── */}
                {products.length > 0 && (
                  <div
                    className="rounded-2xl p-6 lg:p-8 flex flex-col gap-4"
                    style={{ background: "rgba(22,32,52,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-semibold text-white">Produtos em alerta</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Itens com estoque baixo ou zerado</p>
                      </div>
                      {alertProducts.length > 0 && (
                        <span
                          className="text-xs font-semibold px-3 py-1 rounded-full"
                          style={{ background: "rgba(217,119,6,0.15)", color: "#FCD34D" }}
                        >
                          {alertProducts.length} {alertProducts.length === 1 ? "item" : "itens"}
                        </span>
                      )}
                    </div>

                    {alertProducts.length === 0 ? (
                      <div className="flex items-center gap-2.5 py-2">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(5,150,105,0.2)" }}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#6EE7B7" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <p className="text-sm text-slate-400">Todos os produtos estão com estoque normal.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                        {alertProducts.map((p) => (
                          <div key={p.id} className="flex items-center justify-between py-3 gap-3">
                            <p className="text-sm text-white truncate flex-1 min-w-0">{p.name}</p>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span
                                className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                                style={{
                                  background: p.qty === 0 ? "rgba(220,38,38,0.15)" : "rgba(217,119,6,0.15)",
                                  color:      p.qty === 0 ? "#FCA5A5"              : "#FCD34D",
                                }}
                              >
                                {p.qty === 0 ? "Zerado" : `${p.qty} un`}
                              </span>
                              <span className="text-xs text-slate-600 hidden sm:block">{fmt(p.price)}</span>
                              <button
                                type="button"
                                onClick={() => router.push(`/estoque/${p.id}`)}
                                className="text-xs text-brand-400 hover:text-brand-300 cursor-pointer transition-colors duration-200"
                              >
                                →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Distribuição do Estoque ── */}
                {products.length > 0 && (
                  <div
                    className="rounded-2xl p-6 lg:p-8 flex flex-col gap-5"
                    style={{ background: "rgba(22,32,52,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <div>
                      <h2 className="text-base font-semibold text-white">Distribuição do estoque</h2>
                      <p className="text-sm text-slate-500 mt-0.5">Situação geral de todos os produtos</p>
                    </div>

                    <div className="flex flex-col gap-4">
                      {[
                        { label: "Zerado",  count: qtdZerado, color: "#EF4444", bg: "rgba(220,38,38,0.5)"  },
                        { label: "Baixo",   count: qtdBaixo,  color: "#F59E0B", bg: "rgba(217,119,6,0.5)"  },
                        { label: "Normal",  count: qtdNormal, color: "#10B981", bg: "rgba(5,150,105,0.5)"  },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center gap-4">
                          <div className="w-16 flex-shrink-0">
                            <p className="text-xs font-medium" style={{ color: row.color }}>{row.label}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5">{row.count} {row.count === 1 ? "produto" : "produtos"}</p>
                          </div>
                          <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: "rgba(255,255,255,0.06)" }}>
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: totalProdutos > 0 ? `${(row.count / totalProdutos) * 100}%` : "0%",
                                background: row.bg,
                              }}
                            />
                          </div>
                          <p className="text-xs text-slate-600 w-10 text-right flex-shrink-0">
                            {totalProdutos > 0 ? `${Math.round((row.count / totalProdutos) * 100)}%` : "0%"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Filter card ── */}
                <div
                  className="rounded-2xl p-6 lg:p-8 flex flex-col gap-6"
                  style={{ background: "rgba(22,32,52,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div>
                    <h2 className="text-base font-semibold text-white">Consultar produto</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Selecione um produto e o período para ver os dados</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-500 font-medium uppercase tracking-wide">Produto</label>
                      <div className="relative">
                        <select
                          value={selectedProduct}
                          onChange={(e) => { setSelectedProduct(e.target.value); setResult(null); }}
                          className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl text-sm text-white outline-none cursor-pointer transition-all duration-200"
                          style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(255,255,255,0.1)", colorScheme: "dark" }}
                        >
                          <option value="" disabled>Selecione um produto</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                          <ChevronDownIcon />
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-500 font-medium uppercase tracking-wide">Período</label>
                      <div className="relative">
                        <select
                          value={selectedPeriod}
                          onChange={(e) => { setSelectedPeriod(e.target.value); setResult(null); }}
                          className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl text-sm text-white outline-none cursor-pointer transition-all duration-200"
                          style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(255,255,255,0.1)", colorScheme: "dark" }}
                        >
                          {PERIODS.map((p) => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                          ))}
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                          <ChevronDownIcon />
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!selectedProduct || filtering}
                    onClick={handleFilter}
                    className="flex items-center justify-center gap-2 w-full sm:w-48 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
                    style={{
                      background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                      boxShadow: selectedProduct ? "0 4px 14px rgba(37,99,235,0.35)" : "none",
                    }}
                  >
                    {filtering ? (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <SearchIcon />
                    )}
                    {filtering ? "Buscando…" : "Filtrar"}
                  </button>
                </div>

                {/* ── Result ── */}
                {result && (
                  <div
                    className="rounded-2xl p-6 lg:p-8 flex flex-col gap-6"
                    style={{ background: "rgba(22,32,52,0.8)", border: "1px solid rgba(59,130,246,0.2)" }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] text-slate-600 uppercase tracking-widest font-medium mb-1">
                          {PERIODS.find((p) => p.id === selectedPeriod)?.label}
                        </p>
                        <h3 className="font-display font-bold text-lg text-white">{result.name}</h3>
                      </div>
                      <span
                        className="flex-shrink-0 text-xs font-semibold px-3 py-1 rounded-full"
                        style={{
                          background: result.qty === 0 ? "rgba(220,38,38,0.15)" : result.qty < 10 ? "rgba(217,119,6,0.15)" : "rgba(5,150,105,0.15)",
                          color:      result.qty === 0 ? "#FCA5A5"              : result.qty < 10 ? "#FCD34D"              : "#6EE7B7",
                        }}
                      >
                        {result.qty === 0 ? "Zerado" : result.qty < 10 ? "Baixo" : "Normal"}
                      </span>
                    </div>

                    {/* Chart */}
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#10B981" }} />
                          Entradas
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#F59E0B" }} />
                          Saídas
                        </span>
                      </div>
                      <div style={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={result.chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                            <defs>
                              <linearGradient id="gradEntradas" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}    />
                              </linearGradient>
                              <linearGradient id="gradSaidas" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}    />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: "#475569", fontSize: 10 }}
                              tickLine={false}
                              axisLine={false}
                              interval={xAxisInterval}
                            />
                            <YAxis
                              tick={{ fill: "#475569", fontSize: 10 }}
                              tickLine={false}
                              axisLine={false}
                              allowDecimals={false}
                            />
                            <Tooltip content={<MovTooltip />} />
                            <Area
                              type="monotone"
                              dataKey="entradas"
                              name="Entradas"
                              stroke="#10B981"
                              strokeWidth={2}
                              fill="url(#gradEntradas)"
                              dot={false}
                              activeDot={{ r: 4, fill: "#10B981", strokeWidth: 0 }}
                            />
                            <Area
                              type="monotone"
                              dataKey="saidas"
                              name="Saídas"
                              stroke="#F59E0B"
                              strokeWidth={2}
                              fill="url(#gradSaidas)"
                              dot={false}
                              activeDot={{ r: 4, fill: "#F59E0B", strokeWidth: 0 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Metric cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {
                          label: "Quantidade atual",
                          value: `${result.qty} un`,
                          color: result.qty === 0 ? "#FCA5A5" : result.qty < 10 ? "#FCD34D" : "#F1F5F9",
                        },
                        { label: "Entradas no período", value: `+${result.entradas} un`,                           color: "#6EE7B7" },
                        { label: "Saídas no período",   value: `-${result.saidas} un`,                             color: "#FCA5A5" },
                        { label: "Valor em estoque",    value: fmt(result.qty * result.price),                     color: "#93C5FD" },
                        { label: "Média semanal",       value: `${Math.round(result.saidas / weeks)} un/sem`,      color: "#F1F5F9" },
                        { label: "Média mensal",        value: `${Math.round(result.saidas / months)} un/mês`,     color: "#F1F5F9" },
                      ].map((m) => (
                        <div
                          key={m.label}
                          className="rounded-xl p-4 flex flex-col gap-1.5"
                          style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <p className="text-[11px] text-slate-600 font-medium uppercase tracking-wide">{m.label}</p>
                          <p className="font-display font-bold text-xl" style={{ color: m.color }}>{m.value}</p>
                        </div>
                      ))}
                    </div>

                    <div
                      className="flex items-center justify-between pt-2"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <p className="text-xs text-slate-600">Preço unitário: {fmt(result.price)}</p>
                      <button
                        type="button"
                        onClick={() => router.push(`/estoque/${result.id}`)}
                        className="text-xs text-brand-400 hover:text-brand-300 cursor-pointer transition-colors duration-200"
                      >
                        Ver detalhes do item →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
