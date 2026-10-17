"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import PageError from "@/components/ui/PageError";
import ProductAvatar from "@/components/estoque/ProductAvatar";
import StatusChip from "@/components/estoque/StatusChip";
import LevelBar from "@/components/estoque/LevelBar";
import { inputClass } from "@/components/ui/FormField";
import { ArrowRightIcon, CheckIcon, ChevronDownIcon, Spinner } from "@/components/ui/icons";
import { supabase } from "@/lib/supabase";
import { getWorkspace } from "@/hooks/useWorkspace";
import { api } from "@/lib/api";
import { deriveStatus, formatBRL, formatQty, STATUS_LABEL, type StockStatus } from "@/lib/stock";

/* ─── Types ─── */
interface Product {
  id: string;
  name: string;
  qty: number;
  price: number;
  min_qty: number;
  unit: string;
  image_url: string | null;
}

interface DayPoint {
  date: string;
  entradas: number;
  saidas: number;
}

interface ProductResult {
  entradas: number;
  saidas: number;
  chartData: DayPoint[];
}

/* ─── Constants ─── */
const PERIODS = [
  { id: "7",  short: "7 dias",  label: "Últimos 7 dias",  days: 7  },
  { id: "30", short: "30 dias", label: "Últimos 30 dias", days: 30 },
  { id: "90", short: "3 meses", label: "Últimos 3 meses", days: 90 },
];

const DIST: Array<{ status: StockStatus; bar: string }> = [
  { status: "normal", bar: "bg-ok" },
  { status: "baixo",  bar: "bg-low" },
  { status: "zerado", bar: "bg-zero" },
];

/* Cores do tema em hex: o Recharts desenha em SVG e não lê as classes do Tailwind */
const C_ACCENT  = "#60a5fa";
const C_INVERSE = "#eef3fb";
const C_MUTED   = "#a9b5c9";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Chave do dia no fuso local (o rótulo do gráfico também é local) */
function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/* ─── Tooltip do gráfico ─── */
function MovTooltip({ active, payload, label, unit }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl bg-inverse text-ink px-3.5 py-2.5 shadow-lift flex flex-col gap-1">
      <p className="text-xs font-extrabold text-inverse-muted">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-[13px] font-black">
          <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full ${p.name === "Entradas" ? "bg-accent" : "bg-ink"}`} />
          {p.name}: {formatQty(p.value)} {unit}
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
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedPeriod, setSelectedPeriod]   = useState("30");
  const [result, setResult]         = useState<ProductResult | null>(null);
  const [filtering, setFiltering]   = useState(false);
  const [filterError, setFilterError] = useState("");

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
        .select("id, name, qty, price, min_qty, unit, image_url")
        .eq("workspace_id", ws.id)
        .order("name");

      if (err) { setError(err.message); setLoading(false); return; }
      setProducts((data ?? []).map((p) => ({
        ...p,
        qty: Number(p.qty),
        price: Number(p.price),
        min_qty: Number(p.min_qty ?? 0),
      })));
      setLoading(false);
    }
    load();
  }, [router, reloadKey]);

  /* Busca as movimentações sempre que o produto ou o período mudam */
  useEffect(() => {
    if (!selectedProduct) return;
    let ignore = false;
    const period = PERIODS.find((p) => p.id === selectedPeriod)!;

    async function fetchMovements() {
      setFiltering(true);
      setFilterError("");
      const now   = Date.now();
      const since = new Date(now - period.days * DAY_MS).toISOString();

      try {
        const movements = await api.get<{ delta: number; created_at: string }[]>(
          `/products/${selectedProduct}/movements?since=${encodeURIComponent(since)}`
        );
        if (ignore) return;

        let entradas = 0;
        let saidas   = 0;
        const dayMap = new Map<string, { entradas: number; saidas: number }>();
        for (const m of movements) {
          const delta = Number(m.delta);
          const key = dayKey(new Date(m.created_at));
          const cur = dayMap.get(key) ?? { entradas: 0, saidas: 0 };
          if (delta > 0) { cur.entradas += delta; entradas += delta; }
          else           { cur.saidas   += -delta; saidas += -delta; }
          dayMap.set(key, cur);
        }

        /* Preenche os dias sem movimento para o eixo ficar contínuo */
        const chartData: DayPoint[] = [];
        for (let i = period.days - 1; i >= 0; i--) {
          const d = new Date(now - i * DAY_MS);
          const agg = dayMap.get(dayKey(d)) ?? { entradas: 0, saidas: 0 };
          chartData.push({
            date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
            ...agg,
          });
        }

        setResult({ entradas, saidas, chartData });
      } catch (err) {
        if (ignore) return;
        setResult(null);
        setFilterError(err instanceof Error ? err.message : "Não foi possível carregar as movimentações.");
      } finally {
        if (!ignore) setFiltering(false);
      }
    }

    fetchMovements();
    return () => { ignore = true; };
  }, [selectedProduct, selectedPeriod]);

  /* ─── Derived ─── */
  const withStatus = products.map((p) => ({ p, status: deriveStatus(p.qty, p.min_qty) }));
  const totalProdutos = products.length;
  const valorTotal    = products.reduce((acc, p) => acc + p.qty * p.price, 0);
  const alerts = withStatus
    .filter((x) => x.status !== "normal")
    .sort((a, b) => (a.p.min_qty ? a.p.qty / a.p.min_qty : a.p.qty) - (b.p.min_qty ? b.p.qty / b.p.min_qty : b.p.qty));
  const counts: Record<StockStatus, number> = { normal: 0, baixo: 0, zerado: 0 };
  for (const x of withStatus) counts[x.status]++;
  const pct = (n: number) => (totalProdutos > 0 ? Math.round((n / totalProdutos) * 100) : 0);

  const period  = PERIODS.find((p) => p.id === selectedPeriod)!;
  const weeks   = period.days / 7;
  const months  = period.days / 30;
  const product = products.find((p) => p.id === selectedProduct) ?? null;
  const productStatus = product ? deriveStatus(product.qty, product.min_qty) : "normal";
  const xAxisInterval = selectedPeriod === "7" ? 0 : selectedPeriod === "30" ? 4 : 14;

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-ink">
      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      <main className="lg:pl-64 pt-14 pb-28 lg:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5 lg:gap-6">

          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight leading-tight">Métricas</h1>
            <p className="text-sm lg:text-[15px] font-bold text-fg-muted">Como o estoque está agora e o giro de cada produto</p>
          </div>

          {loading ? (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                <div className="col-span-2 lg:col-span-1 h-[132px] rounded-5xl bg-surface animate-pulse" />
                <div className="h-[132px] rounded-5xl bg-surface animate-pulse" />
                <div className="h-[132px] rounded-5xl bg-surface animate-pulse" />
              </div>
              <div className="h-[280px] rounded-5xl bg-surface animate-pulse" />
            </div>
          ) : error ? (
            <PageError message={error} onRetry={() => { setError(""); setLoading(true); setReloadKey((k) => k + 1); }} />
          ) : (
            <>
              {/* ── Resumo ── */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                <div className="col-span-2 lg:col-span-1 bg-accent text-ink rounded-5xl p-5 lg:p-6 flex flex-col gap-2">
                  <p className="text-sm font-extrabold text-ink/70">Valor em estoque</p>
                  <p className="text-[32px] lg:text-[36px] font-black tracking-tight leading-none tabular-nums">{formatBRL(valorTotal)}</p>
                  <p className="text-[13px] font-bold text-ink/70">Quantidade × preço de cada produto</p>
                </div>
                <div className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-2">
                  <p className="text-sm font-extrabold text-fg-muted">Produtos</p>
                  <p className="text-[32px] lg:text-[36px] font-black tracking-tight leading-none tabular-nums">{totalProdutos}</p>
                  <p className="text-[13px] font-bold text-fg-subtle">cadastrados</p>
                </div>
                <Link
                  href="/notificacoes"
                  className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-2 hover:bg-[#19243a] transition-colors"
                >
                  <p className="text-sm font-extrabold text-fg-muted">Em alerta</p>
                  <p className={`text-[32px] lg:text-[36px] font-black tracking-tight leading-none tabular-nums ${alerts.length > 0 ? "text-low" : ""}`}>{alerts.length}</p>
                  <p className="text-[13px] font-bold text-fg-subtle">
                    no mínimo ou zerados <ArrowRightIcon className="inline w-3.5 h-3.5 -mt-0.5" strokeWidth={2.4} />
                  </p>
                </Link>
              </div>

              {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center bg-surface rounded-5xl px-6">
                  <p className="text-lg font-black">Nenhum produto ainda</p>
                  <p className="text-sm font-bold text-fg-muted max-w-sm">As métricas aparecem assim que você cadastrar o primeiro produto.</p>
                  <Link href="/estoque/novo" className="min-h-[48px] px-6 flex items-center rounded-full bg-accent text-ink text-[15px] font-black hover:brightness-110 transition-[filter]">
                    Cadastrar produto
                  </Link>
                </div>
              ) : (
                <div className="grid lg:grid-cols-[1.25fr_1fr] gap-5 lg:gap-6 items-start">

                  {/* ── Produtos em alerta ── */}
                  <section aria-labelledby="met-alertas" className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-4 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-0.5">
                        <h2 id="met-alertas" className="text-lg lg:text-xl font-black">Produtos em alerta</h2>
                        <p className="text-sm font-bold text-fg-muted">Os mais perto de acabar primeiro</p>
                      </div>
                      {alerts.length > 0 && (
                        <span className="flex-shrink-0 px-3 py-1 rounded-full bg-low/15 text-low text-[13px] font-black">
                          {alerts.length} {alerts.length === 1 ? "item" : "itens"}
                        </span>
                      )}
                    </div>

                    {alerts.length === 0 ? (
                      <p className="flex items-center gap-3 p-4 rounded-4xl bg-surface-2 text-sm font-bold text-fg-soft">
                        <span className="w-8 h-8 rounded-full bg-ok/15 text-ok flex items-center justify-center flex-shrink-0">
                          <CheckIcon className="w-4 h-4" strokeWidth={2.8} />
                        </span>
                        Todos os produtos estão acima do mínimo.
                      </p>
                    ) : (
                      <>
                        <ul className="flex flex-col gap-2.5">
                          {alerts.slice(0, 6).map(({ p, status }) => (
                            <li key={p.id}>
                              <Link href={`/estoque/${p.id}`} className="flex items-center gap-3.5 p-3 pr-3.5 rounded-[22px] bg-surface-2 hover:bg-white/10 transition-colors">
                                <ProductAvatar name={p.name} imageUrl={p.image_url} tone="ink" />
                                <span className="flex-1 min-w-0 flex flex-col gap-1.5">
                                  <span className="flex justify-between items-center gap-2">
                                    <span className="text-[15px] font-extrabold truncate">{p.name}</span>
                                    <StatusChip status={status} size="sm" />
                                  </span>
                                  <LevelBar fill={p.min_qty ? Math.min(p.qty / p.min_qty, 1) : 0} status={status} />
                                  <span className="text-[13px] font-bold text-fg-muted truncate">
                                    {formatQty(p.qty)} de {formatQty(p.min_qty)} {p.unit} mínimo · {formatBRL(p.price)}
                                  </span>
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                        {alerts.length > 6 && (
                          <Link href="/notificacoes" className="w-fit flex items-center gap-1.5 min-h-[40px] px-4 rounded-full bg-surface-2 text-sm font-extrabold hover:bg-white/10 transition-colors">
                            Ver todos os {alerts.length} <ArrowRightIcon className="w-4 h-4" strokeWidth={2.4} />
                          </Link>
                        )}
                      </>
                    )}
                  </section>

                  {/* ── Distribuição ── */}
                  <section aria-labelledby="met-dist" className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-5 min-w-0">
                    <div className="flex flex-col gap-0.5">
                      <h2 id="met-dist" className="text-lg lg:text-xl font-black">Distribuição do estoque</h2>
                      <p className="text-sm font-bold text-fg-muted">Situação dos {totalProdutos} produtos</p>
                    </div>

                    <div aria-hidden="true" className="flex h-4 rounded-full overflow-hidden bg-ink gap-[3px]">
                      {DIST.map((d) => counts[d.status] > 0 && (
                        <span key={d.status} className={`h-full ${d.bar}`} style={{ width: `${(counts[d.status] / totalProdutos) * 100}%` }} />
                      ))}
                    </div>

                    <ul className="flex flex-col">
                      {DIST.map((d) => (
                        <li key={d.status} className="flex items-center gap-3 py-3 border-t-2 border-dashed border-white/[0.08] first:border-t-0 first:pt-0">
                          <span aria-hidden="true" className={`w-3 h-3 rounded-full flex-shrink-0 ${d.bar}`} />
                          <span className="flex-1 text-[15px] font-extrabold">{STATUS_LABEL[d.status]}</span>
                          <span className="text-sm font-bold text-fg-muted tabular-nums">
                            {counts[d.status]} {counts[d.status] === 1 ? "produto" : "produtos"}
                          </span>
                          <span className="w-12 text-right text-[15px] font-black tabular-nums">{pct(counts[d.status])}%</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  {/* ── Consultar produto ── */}
                  <section aria-labelledby="met-produto" className="lg:col-span-2 bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-5 min-w-0">
                    <div className="flex flex-col gap-0.5">
                      <h2 id="met-produto" className="text-lg lg:text-xl font-black">Giro por produto</h2>
                      <p className="text-sm font-bold text-fg-muted">Escolha um produto para ver entradas, saídas e médias</p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-3">
                      <div className="relative flex-1 min-w-0">
                        <label htmlFor="met-select" className="sr-only">Produto</label>
                        <select
                          id="met-select"
                          value={selectedProduct}
                          onChange={(e) => setSelectedProduct(e.target.value)}
                          className={`${inputClass} appearance-none pr-11 cursor-pointer`}
                        >
                          <option value="" disabled>Selecione um produto</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-fg-muted pointer-events-none" strokeWidth={2.4} />
                      </div>

                      <div role="group" aria-label="Período" className="flex gap-1 p-1 rounded-full bg-ink self-start lg:self-auto">
                        {PERIODS.map((p) => {
                          const active = selectedPeriod === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              aria-pressed={active}
                              onClick={() => setSelectedPeriod(p.id)}
                              className={`min-h-[40px] px-4 rounded-full text-[13px] cursor-pointer transition-colors duration-200 ${
                                active ? "bg-inverse text-ink font-black" : "text-fg-muted font-extrabold hover:text-fg"
                              }`}
                            >
                              {p.short}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {!product ? (
                      <p className="py-10 text-center text-sm font-bold text-fg-subtle border-2 border-dashed border-white/[0.08] rounded-4xl">
                        Nenhum produto selecionado
                      </p>
                    ) : filterError ? (
                      <p role="alert" className="py-10 text-center text-sm font-bold text-zero">{filterError}</p>
                    ) : !result || filtering ? (
                      <div className="flex flex-col gap-4" aria-busy="true">
                        <span className="sr-only">Carregando movimentações…</span>
                        <div className="h-[240px] lg:h-[280px] rounded-4xl bg-surface-2 animate-pulse flex items-center justify-center text-fg-subtle">
                          <Spinner />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5">
                        <div className="flex items-center gap-3.5">
                          <ProductAvatar name={product.name} imageUrl={product.image_url} />
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <p className="text-lg font-black truncate">{product.name}</p>
                            <p className="text-[13px] font-bold text-fg-muted">{period.label}</p>
                          </div>
                          <StatusChip status={productStatus} />
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                          <div className="flex items-center gap-2.5">
                            <span aria-hidden="true" className="w-3 h-3 rounded-full bg-accent" />
                            <span className="text-[22px] font-black tabular-nums">+{formatQty(result.entradas)}</span>
                            <span className="text-sm font-bold text-fg-muted">entradas</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span aria-hidden="true" className="w-3 h-3 rounded-full bg-inverse" />
                            <span className="text-[22px] font-black tabular-nums">−{formatQty(result.saidas)}</span>
                            <span className="text-sm font-bold text-fg-muted">saídas</span>
                          </div>
                        </div>

                        <div
                          role="img"
                          aria-label={`Gráfico de área: ${formatQty(result.entradas)} ${product.unit} de entrada e ${formatQty(result.saidas)} ${product.unit} de saída de ${product.name} nos ${period.label.toLowerCase()}.`}
                          className="relative h-[240px] lg:h-[280px] -mx-1"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={result.chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                              <CartesianGrid strokeDasharray="4 6" stroke="rgba(255,255,255,0.08)" vertical={false} />
                              <XAxis
                                dataKey="date"
                                tick={{ fill: C_MUTED, fontSize: 12, fontWeight: 700 }}
                                tickLine={false}
                                axisLine={false}
                                interval={xAxisInterval}
                                tickMargin={8}
                              />
                              <YAxis
                                tick={{ fill: C_MUTED, fontSize: 12, fontWeight: 700 }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v: number) => formatQty(v)}
                              />
                              <Tooltip
                                content={<MovTooltip unit={product.unit} />}
                                cursor={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 2, strokeDasharray: "4 4" }}
                              />
                              <Area
                                type="monotone"
                                dataKey="entradas"
                                name="Entradas"
                                stroke={C_ACCENT}
                                strokeWidth={3}
                                fill={C_ACCENT}
                                fillOpacity={0.12}
                                dot={false}
                                activeDot={{ r: 5, fill: C_ACCENT, strokeWidth: 0 }}
                                isAnimationActive={false}
                              />
                              <Area
                                type="monotone"
                                dataKey="saidas"
                                name="Saídas"
                                stroke={C_INVERSE}
                                strokeWidth={3}
                                fill={C_INVERSE}
                                fillOpacity={0.05}
                                dot={false}
                                activeDot={{ r: 5, fill: C_INVERSE, strokeWidth: 0 }}
                                isAnimationActive={false}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                          {result.entradas + result.saidas === 0 && (
                            <p className="absolute inset-x-0 top-[38%] text-center text-sm font-bold text-fg-muted">
                              Nenhuma movimentação nos {period.label.toLowerCase()}.
                            </p>
                          )}
                        </div>

                        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                          {[
                            { label: "Quantidade atual",   value: `${formatQty(product.qty)} ${product.unit}` },
                            { label: "Valor em estoque",   value: formatBRL(product.qty * product.price) },
                            { label: "Saída por semana",   value: `${formatQty(round1(result.saidas / weeks))} ${product.unit}` },
                            { label: "Saída por mês",      value: `${formatQty(round1(result.saidas / months))} ${product.unit}` },
                          ].map((m) => (
                            <div key={m.label} className="rounded-4xl bg-surface-2 p-4 flex flex-col gap-1">
                              <dt className="text-[13px] font-extrabold text-fg-muted">{m.label}</dt>
                              <dd className="text-xl font-black tabular-nums truncate">{m.value}</dd>
                            </div>
                          ))}
                        </dl>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t-2 border-dashed border-white/[0.08]">
                          <p className="text-sm font-bold text-fg-muted">
                            Preço unitário {formatBRL(product.price)} · mínimo {formatQty(product.min_qty)} {product.unit}
                          </p>
                          <Link
                            href={`/estoque/${product.id}`}
                            className="flex items-center gap-1.5 min-h-[44px] px-5 rounded-full bg-surface-2 text-sm font-extrabold hover:bg-white/10 transition-colors"
                          >
                            Abrir produto <ArrowRightIcon className="w-4 h-4" strokeWidth={2.4} />
                          </Link>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
