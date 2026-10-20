"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import TrialBanner from "@/components/dashboard/TrialBanner";
import ProductLimitBanner from "@/components/dashboard/ProductLimitBanner";
import ProductAvatar from "@/components/estoque/ProductAvatar";
import StatusChip from "@/components/estoque/StatusChip";
import LevelBar from "@/components/estoque/LevelBar";
import { supabase } from "@/lib/supabase";
import { getWorkspace, setWorkspace, type WorkspaceRole } from "@/hooks/useWorkspace";
import { can } from "@/hooks/useRole";
import { usePlan, planInfo } from "@/hooks/usePlan";
import { useProducts, type Product } from "@/hooks/useProducts";
import { useMovements, type Movement } from "@/hooks/useMovements";
import { deriveStatus, formatBRL, formatQty, timeAgo, previsaoDias, formatPrevisao, estaParado, PARADO_DIAS, tituloMovimentacao, type StockStatus } from "@/lib/stock";
import { useLastOutflow } from "@/hooks/useLastOutflow";
import { useStockCounts } from "@/hooks/useStockCounts";
import { classesABC, itensDoDia, sequencia, diaBrasil } from "@/lib/contagem";
import { useForecast } from "@/hooks/useForecast";
import { useMemberNames } from "@/hooks/useMemberNames";
import {
  ScanIcon, DocumentIcon, BoxIcon, PlusIcon, ArrowRightIcon, ArrowUpRightIcon, InIcon, OutIcon, CheckIcon,
} from "@/components/ui/icons";

type Period = 7 | 30 | 90;
const PERIODS: { days: Period; label: string }[] = [
  { days: 7,  label: "7 dias" },
  { days: 30, label: "30 dias" },
  { days: 90, label: "3 meses" },
];

const DAY_MS   = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getGreeting() {
  const h = Number(
    new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "numeric", hour12: false })
  );
  if (h >= 6 && h < 12) return "Bom dia";
  if (h >= 12 && h < 18) return "Boa tarde";
  return "Boa noite"; // 18–23 e 00–05
}

interface Bucket { label: string; entradas: number; saidas: number }

/** Conta entradas e saídas por dia (7 e 30 dias) ou por semana (3 meses). O mais antigo vem primeiro. */
function bucketize(movements: Movement[], days: Period, now: number): Bucket[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const weekly = days === 90;
  const span   = weekly ? 7 : 1;
  const count  = weekly ? 13 : days;

  const buckets: Bucket[] = Array.from({ length: count }, (_, i) => {
    const daysAgo = (count - 1 - i) * span + (weekly ? span - 1 : 0);
    const start   = new Date(today.getTime() - daysAgo * DAY_MS);
    const label   = weekly
      ? start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
      : days === 7 ? WEEKDAYS[start.getDay()] : String(start.getDate());
    return { label, entradas: 0, saidas: 0 };
  });

  for (const m of movements) {
    const d = new Date(m.created_at);
    d.setHours(0, 0, 0, 0);
    const ago = Math.round((today.getTime() - d.getTime()) / DAY_MS);
    const idx = count - 1 - Math.floor(ago / span);
    if (idx < 0 || idx >= count) continue;
    if (m.delta > 0) buckets[idx].entradas += 1;
    else if (m.delta < 0) buckets[idx].saidas += 1;
  }
  return buckets;
}

function HeroStat({ value, label, short, className = "" }: { value: number; label: ReactNode; short?: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <dt className="order-2 text-[13px] lg:text-sm font-extrabold text-ink/75">
        {short ? (<><span className="lg:hidden">{short}</span><span className="hidden lg:inline">{label}</span></>) : label}
      </dt>
      <dd className="order-1 text-2xl lg:text-[30px] font-black leading-tight">{value}</dd>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [greeting, setGreeting] = useState("");
  const [today, setToday]       = useState("");
  const [now, setNow]           = useState(0);
  const [userName, setUserName] = useState("");
  const [userId, setUserId]     = useState("");
  const [wsName, setWsName]     = useState("");
  const [wsId, setWsId]         = useState<string | undefined>(undefined);
  const [role, setRole]         = useState<WorkspaceRole>("member");
  const [period, setPeriod]     = useState<Period>(7);
  /* Métricas por plano (EQZ-27): o Basic vai até 30 dias */
  const { plan } = usePlan();
  const periods = PERIODS.filter((p) => p.days <= (planInfo(plan)?.metricasDias ?? 90));
  /* "R$ parados" (EQZ-18, Growth e Pro): estoque sem saída há 60 dias */
  const temParados  = !!planInfo(plan)?.parados;
  const ultimaSaida = useLastOutflow(wsId, temParados);
  /* Contagem do dia (EQZ-17, Growth e Pro, quem edita estoque) */
  const temContagem = !!planInfo(plan)?.contagemDoDia && can(role, "canEditEstoque");
  const { contagens } = useStockCounts(wsId, temContagem);

  /* ── Cache SWR: dados aparecem instantâneo ao voltar ao dashboard ── */
  const { products, loading: productsLoading } = useProducts(wsId);
  const forecast = useForecast(wsId);
  const { movements, loading: movLoading }     = useMovements(wsId, period);
  /* Quem fez cada movimentação: "você" ou o primeiro nome da pessoa */
  const nomes = useMemberNames(wsId);
  const autor = (id: string | null) => {
    if (!id) return "";
    if (id === userId) return " · você";
    if (!nomes) return "";
    const nome = nomes.get(id);
    return nome ? ` · ${nome.split(" ")[0]}` : " · ex-membro";
  };

  useEffect(() => {
    const d = new Date();
    setGreeting(getGreeting());
    setNow(d.getTime());
    const label = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo" });
    setToday(label.charAt(0).toUpperCase() + label.slice(1));

    async function load() {
      const ws = getWorkspace();
      if (!ws) { router.push("/select-workspace"); return; }
      setWsName(ws.name);
      setWsId(ws.id);
      setRole(ws.role);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: profile }, { data: memberData }] = await Promise.all([
        supabase.from("profiles").select("name").eq("id", user.id).single(),
        supabase.from("workspace_members").select("role").eq("workspace_id", ws.id).eq("user_id", user.id).eq("status", "ativo").single(),
      ]);
      setUserName(profile?.name ?? user.email?.split("@")[0] ?? "");
      const freshRole = (memberData?.role ?? ws.role) as WorkspaceRole;
      if (freshRole !== ws.role) setWorkspace({ ...ws, role: freshRole });
      setRole(freshRole);
    }
    load();
  }, [router]);

  const summary = useMemo(() => {
    let value = 0;
    let zero  = 0;
    const alerts: { product: Product; status: StockStatus }[] = [];
    for (const p of products) {
      value += p.qty * p.price;
      const status = deriveStatus(p.qty, p.min_qty ?? 0);
      if (status === "zerado") zero += 1;
      if (status !== "normal") alerts.push({ product: p, status });
    }
    /* Zerados primeiro; depois quem está mais longe do mínimo */
    alerts.sort((a, b) => {
      if (a.status !== b.status) return a.status === "zerado" ? -1 : 1;
      const ra = a.product.qty / Math.max(a.product.min_qty ?? 0, 1);
      const rb = b.product.qty / Math.max(b.product.min_qty ?? 0, 1);
      return ra - rb;
    });
    return { value, zero, alerts };
  }, [products]);

  const weekCount = useMemo(
    () => (now ? movements.filter((m) => now - new Date(m.created_at).getTime() <= 7 * DAY_MS).length : 0),
    [movements, now]
  );
  const buckets  = useMemo(() => (now ? bucketize(movements, period, now) : []), [movements, period, now]);
  const totalIn  = buckets.reduce((s, b) => s + b.entradas, 0);
  const totalOut = buckets.reduce((s, b) => s + b.saidas, 0);
  const maxBar   = Math.max(1, ...buckets.map((b) => Math.max(b.entradas, b.saidas)));
  const barWidth = period === 7 ? "w-3.5" : period === 30 ? "w-1.5" : "w-2.5";
  const periodLabel = PERIODS.find((p) => p.days === period)?.label ?? "";

  const canEdit  = can(role, "canEditEstoque");
  const canNota  = can(role, "canAccessNota");
  const firstName = userName.split(" ")[0];
  const [money, cents] = (() => {
    const s = formatBRL(summary.value);
    const i = s.lastIndexOf(",");
    return i > 0 ? [s.slice(0, i), s.slice(i)] : [s, ""];
  })();

  return (
    <div className="min-h-screen bg-ink">
      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      <main className="lg:pl-64 pt-14 pb-28 lg:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-6 lg:gap-7">

          {wsId && <TrialBanner workspaceId={wsId} />}
          {wsId && <ProductLimitBanner workspaceId={wsId} />}

          <div className="flex flex-col gap-1">
            <h1 suppressHydrationWarning className="text-[26px] lg:text-[32px] font-black tracking-tight leading-tight">
              {greeting || "Olá"}{firstName ? `, ${firstName}` : ""}!
            </h1>
            <p suppressHydrationWarning className="text-sm lg:text-[15px] font-bold text-fg-muted">{today}</p>
          </div>

          {/* ── Resumo + ações rápidas ── */}
          <div className="grid grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 lg:gap-5">
            <section
              aria-label="Resumo do estoque"
              className="relative col-span-2 lg:col-span-1 bg-accent text-ink rounded-5xl lg:rounded-6xl p-[22px] lg:px-8 lg:py-[30px] flex flex-col gap-4 lg:gap-[22px]"
            >
              <div className="flex flex-col gap-1.5 lg:gap-2">
                <p className="text-sm lg:text-base font-extrabold text-ink/80">Valor em estoque</p>
                {productsLoading ? (
                  <span className="block h-11 lg:h-16 w-56 rounded-2xl bg-ink/10 animate-pulse" />
                ) : (
                  <p className="text-[44px] lg:text-[64px] font-black tracking-[-0.035em] leading-none">
                    {money}<span className="text-2xl lg:text-[32px] tracking-tight">{cents}</span>
                  </p>
                )}
              </div>
              <div className="border-t-2 border-dashed border-ink/20" />
              <dl className="grid grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-4">
                <HeroStat value={products.length} label="Produtos" />
                <HeroStat value={summary.alerts.length} label="Em alerta" />
                <HeroStat value={summary.zero} label="Zerados" className="hidden lg:flex" />
                <HeroStat
                  value={weekCount}
                  label={<><span className="block">Movimentações</span><span className="block">em 7 dias</span></>}
                  short="Mov. 7 dias"
                />
              </dl>
              {canEdit && (
                <Link
                  href="/estoque/novo"
                  aria-label="Adicionar produto"
                  className="group absolute -top-3.5 right-5 lg:-top-4 lg:right-7 w-[58px] h-[58px] lg:w-16 lg:h-16 rounded-full bg-ink border-[6px] lg:border-[7px] border-ink flex items-center justify-center"
                >
                  <span className="w-full h-full rounded-full bg-surface-2 text-fg flex items-center justify-center transition-colors duration-200 group-hover:bg-white/15">
                    <PlusIcon className="w-6 h-6" strokeWidth={2.4} />
                  </span>
                </Link>
              )}
            </section>

            <Link
              href="/scanner"
              className="group bg-inverse text-ink rounded-4xl lg:rounded-5xl p-3.5 lg:p-[22px] flex flex-col gap-2.5 lg:gap-3.5 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <span className="flex justify-between items-start">
                <span className="w-11 h-11 lg:w-14 lg:h-14 rounded-full bg-ink text-accent flex items-center justify-center">
                  <ScanIcon className="w-[22px] h-[22px] lg:w-[26px] lg:h-[26px]" />
                </span>
                <ArrowUpRightIcon className="w-5 h-5 text-inverse-muted" strokeWidth={2.2} />
              </span>
              <span className="flex flex-col gap-0.5 lg:gap-1">
                <span className="text-[17px] lg:text-[21px] font-black tracking-tight">Escanear<span className="hidden lg:inline"> produto</span></span>
                <span className="text-[13px] lg:text-sm font-bold text-inverse-muted">Entrada ou saída<span className="hidden lg:inline"> pela câmera</span></span>
              </span>
              <span className="mt-auto border-t-2 border-dashed border-ink/15" />
              <span className="flex justify-between items-center">
                <span className="text-sm lg:text-[15px] font-black">Abrir câmera</span>
                <span className="hidden lg:flex w-11 h-11 rounded-full bg-ink text-fg items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRightIcon />
                </span>
              </span>
            </Link>

            <Link
              href={canNota ? "/nota" : "/estoque"}
              className="group bg-surface text-fg rounded-4xl lg:rounded-5xl p-3.5 lg:p-[22px] flex flex-col gap-2.5 lg:gap-3.5 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <span className="flex justify-between items-start">
                <span className="w-11 h-11 lg:w-14 lg:h-14 rounded-full bg-surface-2 flex items-center justify-center">
                  {canNota
                    ? <DocumentIcon className="w-[22px] h-[22px] lg:w-[26px] lg:h-[26px]" />
                    : <BoxIcon className="w-[22px] h-[22px] lg:w-[26px] lg:h-[26px]" />}
                </span>
                <ArrowUpRightIcon className="w-5 h-5 text-fg-subtle" strokeWidth={2.2} />
              </span>
              <span className="flex flex-col gap-0.5 lg:gap-1">
                <span className="text-[17px] lg:text-[21px] font-black tracking-tight">{canNota ? "Ler nota de compra" : "Ver estoque"}</span>
                <span className="text-[13px] lg:text-sm font-bold text-fg-muted">{canNota ? "Chave de 44 dígitos" : "Produtos e quantidades"}</span>
              </span>
              <span className="mt-auto border-t-2 border-dashed border-white/[0.14]" />
              <span className="flex justify-between items-center">
                <span className="text-sm lg:text-[15px] font-black">{canNota ? "Ler nota" : "Abrir estoque"}</span>
                <span className="hidden lg:flex w-11 h-11 rounded-full bg-surface-2 items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRightIcon />
                </span>
              </span>
            </Link>
          </div>

          {/* ── Atenção + gráfico ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-5">
            <section className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-4 min-w-0">
              <div className="flex justify-between items-start gap-3">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-lg lg:text-xl font-black">Precisa de atenção</h2>
                  <p className="text-sm font-bold text-fg-muted">Estoque baixo ou zerado</p>
                </div>
                <Link href="/notificacoes" className="flex items-center min-h-[40px] px-4 rounded-full bg-surface-2 text-sm font-extrabold hover:bg-white/10 transition-colors">
                  Ver todos
                </Link>
              </div>

              {productsLoading ? (
                <div className="flex flex-col gap-2.5">
                  {[0, 1, 2].map((i) => <div key={i} className="h-[76px] rounded-[22px] bg-surface-2 animate-pulse" />)}
                </div>
              ) : summary.alerts.length === 0 ? (
                <p className="flex items-center gap-3 p-4 rounded-[22px] bg-surface-2 text-sm font-bold text-fg-muted">
                  <CheckIcon className="w-5 h-5 text-ok shrink-0" strokeWidth={2.6} />
                  Tudo em ordem: nenhum produto abaixo do mínimo.
                </p>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {summary.alerts.slice(0, 4).map(({ product: p, status }) => (
                    <li key={p.id}>
                      <Link href={`/estoque/${p.id}`} className="flex items-center gap-3.5 p-3 pr-3.5 rounded-[22px] bg-surface-2 hover:bg-white/10 transition-colors">
                        <ProductAvatar name={p.name} imageUrl={p.image_url} icon={p.icon} tone="ink" />
                        <span className="flex-1 min-w-0 flex flex-col gap-1.5">
                          <span className="flex justify-between items-center gap-2">
                            <span className="text-[15px] font-extrabold truncate">{p.name}</span>
                            <StatusChip status={status} size="sm" />
                          </span>
                          <LevelBar fill={p.min_qty ? Math.min(p.qty / p.min_qty, 1) : 0} status={status} />
                          <span className="text-[13px] font-bold text-fg-muted truncate">
                            {formatQty(p.qty)} de {formatQty(p.min_qty ?? 0)} {p.unit} mínimo
                            {(() => {
                              /* Previsão pela média de saídas (EQZ-16), quando há histórico suficiente */
                              const dias = previsaoDias(p.qty, p.created_at, forecast.get(p.id), now);
                              return dias !== null ? ` · ${formatPrevisao(dias)}` : p.location ? ` · ${p.location}` : "";
                            })()}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                  {/* EQZ-15: dos alertas para a lista de compras pronta para mandar */}
                  <li>
                    <Link href="/compras" className="flex items-center justify-center gap-2 min-h-[48px] rounded-full bg-accent text-ink text-sm font-black hover:brightness-110 transition-[filter]">
                      Montar lista de compras
                    </Link>
                  </li>
                </ul>
              )}
            </section>

            <section className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-[18px] min-w-0">
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-lg lg:text-xl font-black">Movimentações</h2>
                  <p className="text-sm font-bold text-fg-muted">Entradas e saídas registradas</p>
                </div>
                <div role="group" aria-label="Período" className="flex gap-1 p-1 rounded-full bg-ink">
                  {periods.map((p) => {
                    const active = period === p.days;
                    return (
                      <button
                        key={p.days}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setPeriod(p.days)}
                        className={`min-h-[36px] px-3.5 rounded-full text-[13px] cursor-pointer transition-colors duration-200 ${
                          active ? "bg-inverse text-ink font-black" : "text-fg-muted font-extrabold hover:text-fg"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-accent" />
                  <span className="text-[22px] font-black">{totalIn}</span>
                  <span className="text-sm font-bold text-fg-muted">entradas</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-inverse" />
                  <span className="text-[22px] font-black">{totalOut}</span>
                  <span className="text-sm font-bold text-fg-muted">saídas</span>
                </div>
              </div>

              {movLoading || !now ? (
                <div className="h-[220px] rounded-3xl bg-surface-2 animate-pulse" />
              ) : (
                <div
                  role="img"
                  aria-label={`Gráfico de barras: ${totalIn} entradas e ${totalOut} saídas nos últimos ${periodLabel}.`}
                  className="relative flex flex-col gap-2.5"
                >
                  <div
                    className="grid items-end h-[200px] lg:h-[264px] pt-9 pb-2 border-b-2 border-dashed border-white/10"
                    style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))` }}
                  >
                    {buckets.map((b, i) => {
                      /* Alturas em % da área do gráfico (o pt-9 reserva espaço para o balão do último dia) */
                      const pIn  = (b.entradas / maxBar) * 100;
                      const pOut = (b.saidas   / maxBar) * 100;
                      const last = i === buckets.length - 1;
                      return (
                        <div key={i} className="relative flex justify-center items-end gap-[3px] lg:gap-1.5 h-full" title={`${b.label}: ${b.entradas} entradas, ${b.saidas} saídas`}>
                          {last && (b.entradas > 0 || b.saidas > 0) && (
                            <span
                              className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1.5 rounded-xl bg-inverse text-ink text-xs font-black"
                              style={{ bottom: `calc(${Math.max(pIn, pOut)}% + 10px)` }}
                            >
                              +{b.entradas} / −{b.saidas}
                            </span>
                          )}
                          {b.entradas > 0 && <span className={`${barWidth} rounded-full bg-accent`} style={{ height: `max(4px, ${pIn}%)` }} />}
                          {b.saidas > 0 && <span className={`${barWidth} rounded-full bg-inverse`} style={{ height: `max(4px, ${pOut}%)` }} />}
                        </div>
                      );
                    })}
                  </div>
                  <div
                    className="grid text-center text-xs lg:text-[13px] font-extrabold text-fg-muted"
                    style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))` }}
                  >
                    {buckets.map((b, i) => {
                      const last = i === buckets.length - 1;
                      const show = period !== 30 || (buckets.length - 1 - i) % 5 === 0;
                      return <span key={i} className={last ? "text-fg" : ""}>{show ? b.label : ""}</span>;
                    })}
                  </div>
                  {totalIn + totalOut === 0 && (
                    <p className="absolute inset-x-0 top-[70px] text-center text-sm font-bold text-fg-muted">
                      Nenhuma movimentação nos últimos {periodLabel}.
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* ── Contagem do dia: entrada para o ritual diário ── */}
          {(() => {
            if (!temContagem || productsLoading || !now || products.length === 0) return null;
            const itens = itensDoDia(products, classesABC(products, forecast), contagens, now);
            if (itens.length === 0) return null;
            const hoje   = diaBrasil(now);
            const feitos = itens.filter((p) => contagens.some((c) => c.product_id === p.id && diaBrasil(new Date(c.created_at).getTime()) === hoje)).length;
            const seq    = sequencia(contagens, now);
            const pronto = feitos === itens.length;
            return (
              <Link href="/contagem" className="flex items-center justify-between gap-3 px-5 py-4 rounded-4xl bg-surface hover:bg-[#19243a] transition-colors">
                <span className="flex items-center gap-3 min-w-0">
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${pronto ? "bg-ok/15 text-ok" : "bg-accent/15 text-accent"}`}>
                    <CheckIcon className="w-5 h-5" strokeWidth={2.4} />
                  </span>
                  <span className="min-w-0 flex flex-col">
                    <span className="text-[15px] font-black">
                      {pronto ? "Contagem de hoje feita" : `Contagem do dia: confira ${itens.length - feitos} ${itens.length - feitos === 1 ? "produto" : "produtos"}`}
                    </span>
                    <span className="text-[13px] font-bold text-fg-muted">
                      {feitos} de {itens.length} conferidos{seq > 0 ? ` · ${seq} ${seq === 1 ? "dia" : "dias"} seguidos` : " · leva uns 2 minutos"}
                    </span>
                  </span>
                </span>
                <span className="text-sm font-extrabold text-fg-muted shrink-0">{pronto ? "Ver" : "Contar agora"}</span>
              </Link>
            );
          })()}

          {/* ── R$ parados (discreto): só aparece quando há algo parado ── */}
          {(() => {
            if (!temParados || productsLoading) return null;
            const parados = products.filter((p) => estaParado(p.qty, p.created_at, ultimaSaida.get(p.id), now));
            if (parados.length === 0) return null;
            const valor = parados.reduce((s, p) => s + p.qty * p.price, 0);
            return (
              <Link href="/estoque?filtro=parados" className="flex items-center justify-between gap-3 px-5 py-4 rounded-4xl bg-surface hover:bg-[#19243a] transition-colors">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-full bg-surface-2 text-fg-muted flex items-center justify-center shrink-0">
                    <BoxIcon className="w-5 h-5" />
                  </span>
                  <span className="min-w-0 flex flex-col">
                    <span className="text-[15px] font-black">{formatBRL(valor)} parados</span>
                    <span className="text-[13px] font-bold text-fg-muted">
                      {parados.length} {parados.length === 1 ? "produto" : "produtos"} sem saída há {PARADO_DIAS} dias
                    </span>
                  </span>
                </span>
                <span className="text-sm font-extrabold text-fg-muted shrink-0">Ver produtos</span>
              </Link>
            );
          })()}

          {/* ── Atividade recente ── */}
          <section className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-1.5">
            <h2 className="text-lg lg:text-xl font-black pb-2">Atividade recente</h2>
            {movLoading ? (
              <div className="flex flex-col gap-2">
                {[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-2xl bg-surface-2 animate-pulse" />)}
              </div>
            ) : movements.length === 0 ? (
              <p className="py-3 text-sm font-bold text-fg-muted">Nenhuma movimentação nos últimos {periodLabel}.</p>
            ) : (
              <ul className="flex flex-col">
                {movements.slice(0, 5).map((m) => {
                  const isIn = m.delta > 0;
                  const what = tituloMovimentacao(m);
                  return (
                    <li key={m.id} className="flex items-center gap-3.5 py-3 px-1 border-t-2 border-dashed border-white/8">
                      <span className={`w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 ${isIn ? "bg-accent/20 text-accent" : "bg-inverse/10 text-inverse"}`}>
                        {isIn ? <InIcon className="w-5 h-5" strokeWidth={2.2} /> : <OutIcon className="w-5 h-5" strokeWidth={2.2} />}
                      </span>
                      <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                        {m.product.id ? (
                          <Link href={`/estoque/${m.product.id}`} className="text-[15px] font-extrabold truncate hover:text-accent transition-colors">{m.product.name}</Link>
                        ) : (
                          <span className="text-[15px] font-extrabold truncate">{m.product.name}</span>
                        )}
                        <span className="text-[13px] font-bold text-fg-muted truncate">
                          {what}{autor(m.created_by)}
                        </span>
                      </span>
                      <span className="flex flex-col sm:flex-row items-end sm:items-center gap-0.5 sm:gap-4 shrink-0">
                        <span className={`text-[15px] lg:text-base font-black ${isIn ? "text-accent" : ""}`}>
                          {isIn ? "+" : "−"}{formatQty(Math.abs(m.delta))} {m.product.unit}
                        </span>
                        <span className="sm:w-[86px] text-right text-xs lg:text-[13px] font-bold text-fg-subtle">{timeAgo(m.created_at, now)}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

        </div>
      </main>

      <BottomNav />
    </div>
  );
}
