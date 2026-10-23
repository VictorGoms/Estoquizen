"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import PageLoader from "@/components/ui/PageLoader";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { getWorkspace, clearWorkspace } from "@/hooks/useWorkspace";
import { useRole, can } from "@/hooks/useRole";
import { exportProductsCsv, exportMovementsCsv } from "@/lib/exportCsv";
import AccessDenied from "@/components/ui/AccessDenied";
import FormField, { inputClass } from "@/components/ui/FormField";
import { CheckIcon, Spinner } from "@/components/ui/icons";
import { PLAN_INFO } from "@/hooks/usePlan";
import { PLANOS } from "@/lib/planos";
import Cancelamento from "@/components/configuracoes/Cancelamento";
import Desistencia, { type ResultadoDesistencia } from "@/components/configuracoes/Desistencia";
import { mutateSubscription } from "@/hooks/useSubscription";
import { formatBRL } from "@/lib/stock";
import { PRAZO_RESPOSTA } from "@/lib/site";
import PagamentoEmbutido from "@/components/pagamento/PagamentoEmbutido";
import { pagamentoEmbutido } from "@/lib/pagamento";
import { SEGMENTOS, type Segmento } from "@/lib/segmentos";

/* ─── Icons ─── */
const ExternalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

/* ─── Plan config ─── */
type Plan = "basic" | "growth" | "pro";

const PLAN_CONFIG: Record<Plan, { label: string; limit: string; color: string; bg: string; border: string }> = {
  basic:  { label: "Basic",  limit: "até 50 produtos",    color: "#94A3B8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.2)" },
  growth: { label: "Growth", limit: "até 300 produtos",   color: "#93C5FD", bg: "rgba(37,99,235,0.12)",   border: "rgba(59,130,246,0.25)" },
  pro:    { label: "Pro",    limit: "até 2000 produtos",  color: "#FCD34D", bg: "rgba(217,119,6,0.12)",   border: "rgba(245,158,11,0.25)" },
};

const ORDEM: Plan[] = ["basic", "growth", "pro"];
const fmt = (n: number) => n.toLocaleString("pt-BR");
const periodo = (dias: number) => (dias >= 365 ? "12 meses" : dias >= 90 ? "3 meses" : `${dias} dias`);

/** O que muda ao descer de plano: limites menores e recursos que deixam de existir. */
function perdas(de: Plan, para: Plan): string[] {
  const a = PLAN_INFO[de], b = PLAN_INFO[para];
  const l: string[] = [];
  if (b.produtos < a.produtos) l.push(`Até ${fmt(b.produtos)} produtos (hoje: até ${fmt(a.produtos)})`);
  if (b.membros !== null && (a.membros === null || b.membros < a.membros)) l.push(`Equipe de até ${b.membros} pessoas`);
  if (b.notasPorMes !== null && a.notasPorMes === null) l.push(`Ler nota de compra: ${b.notasPorMes} por mês`);
  if (b.metricasDias < a.metricasDias) l.push(`Métricas só dos últimos ${periodo(b.metricasDias)}`);
  if (a.contagemDoDia && !b.contagemDoDia) l.push("Sem a contagem do dia");
  if (a.parados && !b.parados) l.push("Sem o dinheiro parado em estoque");
  if (a.historicoPorPessoa && !b.historicoPorPessoa) l.push("Sem o histórico por funcionário");
  return l;
}

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  plan: Plan;
  segment: Segmento | null;
  segment_other: string | null;
}

/* ─── Passos da exclusão do workspace ─── */
type CancelStep = "idle" | "warn" | "confirm";

interface Subscription {
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  cancel_at_period_end: boolean;
  /* Pausa (EQZ-07): período bloqueado e o que a API calcula na hora */
  pause_starts_at?: string | null;
  pause_ends_at?: string | null;
  pausada?: boolean;
  pausa_agendada?: boolean;
  pausa_disponivel?: boolean;
}

export default function ConfiguracoesPage() {
  const router = useRouter();
  const wsRole = useRole();

  const [wsName, setWsName]   = useState("");
  const [userName, setUserName] = useState("");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [productCount, setProductCount] = useState(0);
  /* Ativos + convites pendentes, como a API conta. null se não deu para ler */
  const [memberCount, setMemberCount]   = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  /* Ramo do negócio (EQZ-13) */
  const [editSeg, setEditSeg]   = useState<Segmento | null>(null);
  const [editSegOutro, setEditSegOutro] = useState("");
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [upgradingTo, setUpgradingTo]   = useState<Plan | null>(null);
  const [planError, setPlanError]       = useState("");
  /* Descer de plano pede confirmação na tela (subir já mostra o valor no Stripe) */
  const [confirmando, setConfirmando]   = useState<Plan | null>(null);
  const [portalLoading, setPortalLoading] = useState<"manage" | null>(null);
  const [portalError, setPortalError]     = useState("");
  /* EQZ-07: a pergunta e a oferta antes do cancelamento do Stripe */
  const [cancelando, setCancelando]       = useState(false);
  const [retomando, setRetomando]         = useState(false);
  /* Assinar dentro do app (Checkout incorporado); troca de plano de quem já paga segue no portal */
  const [pagandoPlano, setPagandoPlano]   = useState<Plan | null>(null);
  const [erroPausa, setErroPausa]         = useState("");
  /* EQZ-50: desistência feita agora (quanto voltou) */
  const [desistiu, setDesistiu]           = useState<ResultadoDesistencia | null>(null);

  const [exporting, setExporting]   = useState<"produtos" | "movimentacoes" | null>(null);
  const [exportMsg, setExportMsg]   = useState("");
  const [exportError, setExportError] = useState("");

  const [cancelStep, setCancelStep]     = useState<CancelStep>("idle");
  const [deleteInput, setDeleteInput]   = useState("");
  const [cancelling, setCancelling]     = useState(false);
  const [cancelError, setCancelError]   = useState("");

  useEffect(() => {
    async function load() {
      const ws = getWorkspace();
      if (!ws) { router.push("/select-workspace"); return; }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
        setUserName(profile?.name ?? user.email?.split("@")[0] ?? "");
      }

      const [wsResult, countResult, subResult, membersResult] = await Promise.all([
        supabase.from("workspaces").select("id, name, description, plan, segment, segment_other").eq("id", ws.id).single(),
        supabase.from("products").select("*", { count: "exact", head: true }).eq("workspace_id", ws.id),
        api.get<Subscription | null>(`/billing/subscription?workspace_id=${ws.id}`).catch(() => null),
        supabase.from("workspace_members").select("user_id", { count: "exact", head: true })
          .eq("workspace_id", ws.id).in("status", ["ativo", "pendente"]),
      ]);

      if (wsResult.data) {
        const w = wsResult.data as Workspace;
        setWorkspace(w);
        setWsName(w.name);
        setEditName(w.name);
        setEditDesc(w.description ?? "");
        setEditSeg(w.segment);
        setEditSegOutro(w.segment_other ?? "");
      }
      setProductCount(countResult.count ?? 0);
      setMemberCount(membersResult.error ? null : membersResult.count ?? 0);
      if (subResult) setSubscription(subResult);
      setLoading(false);
    }
    load();
  }, [router]);

  /* Quem já paga recebe da API a tela de confirmação do portal (valor proporcional); os outros, o checkout */
  async function handleUpgrade(plan: Plan) {
    if (!workspace) return;
    const jaPaga = !!subscription?.stripe_subscription_id && (subscription.status === "active" || subscription.status === "past_due");
    if (pagamentoEmbutido && !jaPaga) { setPlanError(""); setPagandoPlano(plan); return; }
    setUpgradingTo(plan);
    setPlanError("");
    try {
      const { url } = await api.post<{ url: string }>("/billing/checkout", {
        workspace_id: workspace.id,
        plan,
      });
      window.location.assign(url);
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Não foi possível trocar de plano. Tente novamente.");
      setUpgradingTo(null);
    }
  }

  /* Portal do Stripe: cartão, faturas e troca de plano. Cancelar é aqui no app (Cancelamento.tsx) */
  async function handlePortal() {
    if (!workspace) return;
    setPortalLoading("manage");
    setPortalError("");
    try {
      const { url } = await api.post<{ url: string }>("/billing/portal", { workspace_id: workspace.id });
      window.location.href = url;
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : "Não foi possível abrir o portal. Tente novamente.");
      setPortalLoading(null);
    }
  }

  /* Desfaz o cancelamento agendado: a assinatura volta a renovar */
  async function desfazerCancelamento() {
    if (!workspace) return;
    setRetomando(true);
    setErroPausa("");
    try {
      await api.post("/billing/uncancel", { workspace_id: workspace.id });
      setSubscription((s) => (s ? { ...s, cancel_at_period_end: false } : s));
      mutateSubscription(workspace.id);
    } catch (err) {
      setErroPausa(err instanceof Error ? err.message : "Não foi possível desfazer o cancelamento. Tente novamente.");
    } finally {
      setRetomando(false);
    }
  }

  /* Desfaz a pausa agendada, ou retoma a que está em andamento (cobra hoje e libera na hora) */
  async function retomarPausa() {
    if (!workspace) return;
    setRetomando(true);
    setErroPausa("");
    try {
      await api.post("/billing/resume", { workspace_id: workspace.id });
      const s = await api.get<Subscription>(`/billing/subscription?workspace_id=${workspace.id}`).catch(() => null);
      if (s) setSubscription(s);
      mutateSubscription(workspace.id);
    } catch (err) {
      setErroPausa(err instanceof Error ? err.message : "Não foi possível desfazer a pausa. Tente novamente.");
    } finally {
      setRetomando(false);
    }
  }

  async function handleExport(what: "produtos" | "movimentacoes") {
    if (!workspace) return;
    setExporting(what);
    setExportMsg("");
    setExportError("");
    try {
      const n = what === "produtos"
        ? await exportProductsCsv(workspace.id, workspace.name)
        : await exportMovementsCsv(workspace.id, workspace.name);
      setExportMsg(what === "produtos"
        ? `${n} ${n === 1 ? "produto exportado" : "produtos exportados"}.`
        : `${n} ${n === 1 ? "movimentação exportada" : "movimentações exportadas"}.`);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Não foi possível exportar. Tente novamente.");
    } finally {
      setExporting(null);
    }
  }

  function formatDate(iso: string | null | undefined) {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace) return;
    setSaving(true);
    setError("");

    /* Pela API: ela checa a assinatura (somente leitura) e o banco não aceita mais escrita direta */
    try {
      await api.patch(`/workspaces/${workspace.id}`, {
        name: editName.trim(),
        description: editDesc.trim() || null,
        segment: editSeg,
        segment_other: editSeg === "outro" ? editSegOutro.trim() || null : null,
      });
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
      return;
    }
    setSaving(false);

    setWorkspace((w) => w ? { ...w, name: editName.trim(), description: editDesc.trim() || null, segment: editSeg } : w);
    setWsName(editName.trim());

    const stored = getWorkspace();
    if (stored) {
      const { setWorkspace: setWs } = await import("@/hooks/useWorkspace");
      setWs({ id: stored.id, name: editName.trim(), role: stored.role });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleDeleteWorkspace() {
    if (!workspace || deleteInput !== workspace.name) return;
    setCancelling(true);
    setCancelError("");

    try {
      await api.delete(`/workspaces/${workspace.id}`);
      /* Continua logado: a pessoa pode ter outros workspaces (antes ia para o /login) */
      clearWorkspace();
      router.push("/select-workspace");
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Não foi possível excluir o workspace.");
      setCancelling(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-ink flex items-center justify-center"><PageLoader /></div>
  );

  const plan = PLAN_CONFIG[workspace?.plan ?? "basic"];
  const limit = workspace?.plan === "pro" ? 2000 : workspace?.plan === "growth" ? 300 : 50;
  const usagePct = Math.min(100, Math.round((productCount / limit) * 100));
  const usageBar = usagePct >= 90 ? "bg-zero" : usagePct >= 70 ? "bg-low" : "bg-ok";
  const confirmLabel = `Digite "${workspace?.name ?? ""}" para confirmar`;
  const paying          = subscription?.status === "active" || subscription?.status === "past_due";
  const scheduledCancel = paying && !!subscription?.cancel_at_period_end;
  const canCancel       = paying && !!subscription?.stripe_subscription_id && !subscription?.cancel_at_period_end;

  if (!can(wsRole, "canAccessConfiguracoes")) return <AccessDenied />;

  return (
    <div className="min-h-screen bg-ink">
      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      <main className="lg:pl-64 pt-14 pb-28 lg:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5">

          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight leading-tight">Configurações</h1>
            <p className="text-sm lg:text-[15px] font-bold text-fg-muted">Workspace, plano e assinatura</p>
          </div>

          {/* ── Plano & cobrança ── */}
          <section aria-labelledby="cfg-plano" className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 id="cfg-plano" className="text-sm font-extrabold text-fg-muted">Plano atual</h2>
                <p className="flex items-baseline gap-2.5">
                  <span className="text-[32px] font-black tracking-tight leading-none">{plan.label}</span>
                  <span className="text-sm font-bold text-fg-muted">{plan.limit}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="text-fg-muted">Produtos cadastrados</span>
                <span className="font-black">{productCount} / {limit}</span>
              </div>
              <div aria-hidden="true" className="h-2.5 rounded-full bg-ink overflow-hidden">
                <div className={`h-full rounded-full ${usageBar}`} style={{ width: `${Math.max(usagePct, productCount > 0 ? 3 : 0)}%` }} />
              </div>
            </div>

            <dl className="flex flex-col">
              <div className="flex items-center justify-between gap-3 py-3 border-t-2 border-dashed border-white/8 text-sm">
                <dt className="font-bold text-fg-muted">
                  {subscription?.status === "trialing" ? "Trial expira em" : scheduledCancel ? "Acesso até" : "Próxima renovação"}
                </dt>
                <dd className="font-extrabold">
                  {subscription?.status === "trialing"
                    ? (formatDate(subscription.trial_ends_at) ?? "—")
                    : subscription?.status === "active" || subscription?.status === "past_due"
                    ? (formatDate(subscription.current_period_end) ?? "—")
                    : "—"}
                </dd>
              </div>
            </dl>

            {desistiu && (
              <p role="status" className="px-5 py-3.5 rounded-4xl bg-ok/10 text-sm font-bold text-ok leading-relaxed">
                Desistência feita e assinatura cancelada.
                {desistiu.devolvido > 0 && ` Devolvemos ${formatBRL(desistiu.devolvido / 100)} no cartão: o estorno aparece em 5 a 10 dias úteis, dependendo do banco.`}
                {desistiu.manual > 0 && ` Uma parte (${formatBRL(desistiu.manual / 100)}) foi paga sem estorno automático: vamos escrever no seu e-mail em até ${PRAZO_RESPOSTA} para devolver.`}
                {" "}Os dados ficam guardados por 30 dias; dá para exportar abaixo.
              </p>
            )}

            {scheduledCancel && (
              <div role="status" className="px-5 py-3.5 rounded-4xl bg-low/10 flex flex-col gap-3">
                <p className="text-sm font-bold text-low leading-relaxed">
                  Cancelamento agendado. O acesso completo continua até {formatDate(subscription?.current_period_end) ?? "o fim do ciclo pago"};
                  depois, o workspace fica bloqueado e os dados ficam guardados por 30 dias (dá para exportar) antes de serem excluídos.
                </p>
                {can(wsRole, "canGerenciarAssinatura") && (
                  <button
                    type="button"
                    onClick={desfazerCancelamento}
                    disabled={retomando}
                    className="self-start min-h-[44px] px-5 rounded-full bg-ink text-sm font-black text-fg cursor-pointer hover:bg-panel transition-colors disabled:opacity-60 flex items-center gap-2"
                  >
                    {retomando && <Spinner className="w-4 h-4" />}
                    {retomando ? "Desfazendo…" : "Desfazer cancelamento"}
                  </button>
                )}
                {erroPausa && <p role="alert" className="text-sm font-bold text-zero">{erroPausa}</p>}
              </div>
            )}

            {(subscription?.pausa_agendada || subscription?.pausada) && !scheduledCancel && (
              <div role="status" className="px-5 py-3.5 rounded-4xl bg-low/10 flex flex-col gap-3">
                <p className="text-sm font-bold text-low leading-relaxed">
                  {subscription.pausada
                    ? <>Assinatura pausada até {formatDate(subscription.pause_ends_at)}. Nada é cobrado e o app fica bloqueado nesse período; os dados ficam guardados. Depois a cobrança e o acesso voltam sozinhos.</>
                    : <>Pausa agendada. O acesso continua normal até {formatDate(subscription.pause_starts_at)}; de lá até {formatDate(subscription.pause_ends_at)} o workspace fica pausado, sem cobrança, e depois volta sozinho.</>}
                </p>
                {can(wsRole, "canGerenciarAssinatura") && (
                  <button
                    type="button"
                    onClick={retomarPausa}
                    disabled={retomando}
                    className="self-start min-h-[44px] px-5 rounded-full bg-ink text-sm font-black text-fg cursor-pointer hover:bg-panel transition-colors disabled:opacity-60 flex items-center gap-2"
                  >
                    {retomando && <Spinner className="w-4 h-4" />}
                    {subscription.pausada ? (retomando ? "Retomando…" : "Retomar agora (cobra hoje)") : (retomando ? "Desfazendo…" : "Desfazer pausa")}
                  </button>
                )}
                {erroPausa && <p role="alert" className="text-sm font-bold text-zero">{erroPausa}</p>}
              </div>
            )}

            {/* ── Trocar de plano: qualquer um, para cima ou para baixo. Descer só se o uso couber
                   (a API confere também) e depois de ver o que muda ── */}
            {can(wsRole, "canGerenciarAssinatura") && workspace && (
              <div className="flex flex-col gap-2.5">
                <h3 className="text-sm font-extrabold text-fg-muted">Trocar de plano</h3>
                {ORDEM.filter((p) => p !== workspace.plan).map((p) => {
                  const venda  = PLANOS.find((x) => x.id === p)!;
                  const info   = PLAN_INFO[p];
                  const descer = ORDEM.indexOf(p) < ORDEM.indexOf(workspace.plan);
                  const aberto = confirmando === p;
                  const bloqueios = [
                    productCount > info.produtos
                      && `Você tem ${fmt(productCount)} produtos e o ${info.label} vai até ${fmt(info.produtos)}: remova ${fmt(productCount - info.produtos)} antes de mudar.`,
                    info.membros !== null && memberCount !== null && memberCount > info.membros
                      && `A equipe tem ${memberCount} pessoas (com convites pendentes) e o ${info.label} vai até ${info.membros}: remova ${memberCount - info.membros} antes de mudar.`,
                  ].filter(Boolean) as string[];

                  return (
                    <div key={p} id={`plano-${p}`} className="bg-surface-2 rounded-4xl p-4 flex flex-col gap-3 scroll-mt-24">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <p className="flex items-baseline gap-2">
                            <span className="text-lg font-black">{info.label}</span>
                            <span className="text-sm font-extrabold text-fg-muted">{venda.price}{venda.priceNote}</span>
                          </p>
                          <p className="text-[13px] font-bold text-fg-muted">
                            Até {fmt(info.produtos)} produtos · {info.membros === null ? "equipe sem limite" : `equipe de até ${info.membros}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => (descer ? setConfirmando(aberto ? null : p) : handleUpgrade(p))}
                          disabled={!!upgradingTo}
                          aria-expanded={descer ? aberto : undefined}
                          className={`min-h-[44px] px-5 rounded-full text-sm font-black cursor-pointer transition-[filter,background-color] disabled:opacity-60 ${
                            descer ? "bg-ink hover:bg-panel" : "bg-accent text-ink hover:brightness-110"
                          }`}
                        >
                          {upgradingTo === p ? "Aguarde…" : `Mudar para ${info.label}`}
                        </button>
                      </div>

                      {descer && aberto && (
                        <div className="flex flex-col gap-3 pt-3 border-t-2 border-dashed border-white/8">
                          <div className="flex flex-col gap-1.5">
                            <p className="text-sm font-extrabold">O que muda no {info.label}:</p>
                            <ul className="flex flex-col gap-1">
                              {perdas(workspace.plan, p).map((t) => (
                                <li key={t} className="text-sm font-bold text-fg-muted">• {t}</li>
                              ))}
                            </ul>
                          </div>
                          {bloqueios.length > 0 ? (
                            <p role="alert" className="text-sm font-bold text-zero">{bloqueios.join(" ")}</p>
                          ) : (
                            <>
                              {paying && (
                                <p className="text-[13px] font-bold text-fg-subtle">
                                  A mudança vale na hora. O valor não usado do plano atual vira crédito na próxima fatura.
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => handleUpgrade(p)}
                                  disabled={!!upgradingTo}
                                  className="min-h-[44px] px-5 rounded-full bg-inverse text-ink text-sm font-black cursor-pointer hover:brightness-95 transition-[filter] disabled:opacity-60"
                                >
                                  {upgradingTo === p ? "Aguarde…" : `Confirmar: mudar para ${info.label}`}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmando(null)}
                                  className="min-h-[44px] px-5 rounded-full text-sm font-extrabold text-fg-muted cursor-pointer hover:bg-white/5 hover:text-fg transition-colors"
                                >
                                  Voltar
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {planError && <p role="alert" className="text-sm font-bold text-zero">{planError}</p>}
              </div>
            )}

            {!can(wsRole, "canGerenciarAssinatura") ? (
              <p className="px-5 py-3.5 rounded-4xl bg-surface-2/60 text-sm font-bold text-fg-subtle">
                Só o dono do workspace pode trocar de plano e gerenciar a assinatura.
              </p>
            ) : subscription?.stripe_customer_id ? (
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => handlePortal()}
                  disabled={!!portalLoading}
                  className="w-full min-h-[52px] flex items-center justify-between px-5 rounded-full bg-surface-2 text-[15px] font-extrabold cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-60"
                >
                  <span>{portalLoading === "manage" ? "Abrindo…" : "Gerenciar assinatura e pagamento"}</span>
                  <ExternalIcon />
                </button>
                {paying && subscription?.stripe_subscription_id && workspace && (
                  <Desistencia
                    workspaceId={workspace.id}
                    onDesistiu={(r) => {
                      setDesistiu(r);
                      setCancelando(false);
                      setSubscription((s) => (s ? {
                        ...s, status: "canceled", cancel_at_period_end: false, pausada: false, pausa_agendada: false, pausa_disponivel: false,
                      } : s));
                      if (workspace) mutateSubscription(workspace.id);
                    }}
                  />
                )}
                {canCancel && !cancelando && (
                  <button
                    type="button"
                    onClick={() => setCancelando(true)}
                    disabled={!!portalLoading}
                    className="w-full min-h-[52px] flex items-center justify-between gap-3 px-5 rounded-full text-[15px] font-extrabold text-fg-muted cursor-pointer hover:bg-surface-2 hover:text-fg transition-colors disabled:opacity-60"
                  >
                    <span className="text-left">
                      Cancelar assinatura
                      <span className="block text-[13px] font-bold text-fg-subtle">Vale no fim do ciclo pago. Depois disso, os dados ficam guardados por 30 dias.</span>
                    </span>
                  </button>
                )}
                {canCancel && cancelando && workspace && (
                  <Cancelamento
                    workspaceId={workspace.id}
                    plan={workspace.plan}
                    productCount={productCount}
                    memberCount={memberCount}
                    proximaCobranca={subscription?.current_period_end ?? null}
                    pausaDisponivel={!!subscription?.pausa_disponivel}
                    onCancelado={() => {
                      setCancelando(false);
                      setSubscription((s) => (s ? {
                        ...s, cancel_at_period_end: true, pausada: false, pausa_agendada: false, pause_starts_at: null, pause_ends_at: null,
                      } : s));
                      if (workspace) mutateSubscription(workspace.id);
                    }}
                    onDescer={(alvo) => {
                      setCancelando(false);
                      setConfirmando(alvo);
                      requestAnimationFrame(() => document.getElementById(`plano-${alvo}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
                    }}
                    onPausado={(pausa) => {
                      setCancelando(false);
                      setSubscription((s) => (s ? { ...s, ...pausa, pausa_agendada: true, pausa_disponivel: false } : s));
                      if (workspace) mutateSubscription(workspace.id);
                    }}
                    onFechar={() => setCancelando(false)}
                  />
                )}
                {portalError && <p role="alert" className="text-sm font-bold text-zero">{portalError}</p>}
              </div>
            ) : (
              <p className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5 py-3.5 rounded-4xl bg-surface-2/60 text-sm font-bold text-fg-subtle">
                <span>Gerenciar assinatura</span>
                <span className="text-[13px]">Disponível após o 1º pagamento</span>
              </p>
            )}
          </section>

          {/* ── Informações da empresa ── */}
          <form onSubmit={handleSave} className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-4">
            <h2 className="text-lg font-black">Informações da empresa</h2>
            <FormField label="Nome da empresa" htmlFor="cfg-nome" required>
              <input id="cfg-nome" type="text" required autoComplete="organization" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="Descrição (opcional)" htmlFor="cfg-desc">
              <textarea
                id="cfg-desc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                placeholder="Descreva sua empresa…"
                className={`${inputClass} h-auto py-3 resize-none`}
              />
            </FormField>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-extrabold text-fg-muted mb-2">Ramo do negócio</legend>
              <div role="radiogroup" className="flex flex-wrap gap-2">
                {SEGMENTOS.map((s) => {
                  const ativo = editSeg === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={ativo}
                      onClick={() => setEditSeg(s.id)}
                      className={`min-h-[44px] px-4 rounded-full text-sm font-extrabold cursor-pointer transition-colors ${
                        ativo ? "bg-inverse text-ink" : "bg-surface-2 text-fg-soft hover:text-fg"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              {editSeg === "outro" && (
                <input
                  aria-label="Qual é o seu negócio?"
                  type="text"
                  maxLength={60}
                  value={editSegOutro}
                  onChange={(e) => setEditSegOutro(e.target.value)}
                  placeholder="Ex.: papelaria, farmácia, distribuidora"
                  className={inputClass}
                />
              )}
              <p className="text-[13px] font-bold text-fg-subtle">Muda a ordem das unidades no cadastro e a lista pronta de produtos.</p>
            </fieldset>
            {error && <p role="alert" className="text-sm font-bold text-zero">{error}</p>}
            <button
              type="submit"
              disabled={saving || !editName.trim()}
              className="min-h-[52px] flex items-center justify-center gap-2 rounded-full bg-accent text-ink text-[15px] font-black cursor-pointer hover:brightness-110 transition-[filter] disabled:opacity-50"
            >
              {saving ? <Spinner className="w-[18px] h-[18px]" /> : saved ? <CheckIcon /> : null}
              {saving ? "Salvando…" : saved ? "Salvo!" : "Salvar alterações"}
            </button>
          </form>

          {/* ── Exportar dados — vale também no modo somente leitura ── */}
          <section id="exportar" aria-labelledby="cfg-exportar" className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-4 scroll-mt-20">
            <div className="flex flex-col gap-1.5">
              <h2 id="cfg-exportar" className="text-lg font-black">Exportar dados</h2>
              <p className="text-sm font-semibold text-fg-muted leading-relaxed">
                Baixe uma planilha (CSV) para abrir no Excel ou no Google Planilhas. Funciona mesmo sem assinatura ativa.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleExport("produtos")}
                disabled={!!exporting}
                className="min-h-[48px] flex items-center justify-center gap-2 rounded-full bg-surface-2 text-[15px] font-extrabold cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-60"
              >
                {exporting === "produtos" && <Spinner className="w-4 h-4" />}
                {exporting === "produtos" ? "Gerando…" : "Produtos"}
              </button>
              <button
                type="button"
                onClick={() => handleExport("movimentacoes")}
                disabled={!!exporting}
                className="min-h-[48px] flex items-center justify-center gap-2 rounded-full bg-surface-2 text-[15px] font-extrabold cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-60"
              >
                {exporting === "movimentacoes" && <Spinner className="w-4 h-4" />}
                {exporting === "movimentacoes" ? "Gerando…" : "Movimentações"}
              </button>
            </div>
            {exportMsg   && <p role="status" className="text-sm font-bold text-ok">{exportMsg}</p>}
            {exportError && <p role="alert"  className="text-sm font-bold text-zero">{exportError}</p>}
          </section>

          {/* ── Excluir workspace — só owner. Cancelar só a assinatura fica no bloco do plano ── */}
          {can(wsRole, "canExcluirWorkspace") && (
            <section aria-labelledby="cfg-excluir" className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-4 ring-1 ring-zero/25">
              <div className="flex flex-col gap-1.5">
                <h2 id="cfg-excluir" className="text-lg font-black text-zero">Excluir workspace</h2>
                <p className="text-sm font-semibold text-fg-muted leading-relaxed">
                  Apaga <strong className="text-fg font-extrabold">para sempre</strong> produtos, movimentações, membros e o workspace.
                  Se houver assinatura paga, ela é cancelada na hora. Para guardar uma cópia, exporte os dados antes.
                </p>
              </div>

              {cancelStep === "idle" && (
                <button
                  type="button"
                  onClick={() => setCancelStep("warn")}
                  className="min-h-[48px] rounded-full bg-zero/10 text-zero text-[15px] font-extrabold cursor-pointer hover:bg-zero/20 transition-colors"
                >
                  Excluir workspace
                </button>
              )}

              {cancelStep === "warn" && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-3xl bg-zero/10 p-4 flex flex-col gap-2">
                    <p className="text-[15px] font-black">Tem certeza absoluta?</p>
                    <ul className="text-sm font-semibold text-fg-muted flex flex-col gap-1 list-disc list-inside leading-relaxed">
                      <li>Os <strong className="text-fg">{productCount} produto(s)</strong> serão excluídos</li>
                      <li>Todo o histórico de movimentações será apagado</li>
                      <li>Todos os membros perderão o acesso</li>
                      <li>Não dá para recuperar os dados depois</li>
                    </ul>
                  </div>
                  <div className="flex gap-2.5">
                    <button type="button" onClick={() => setCancelStep("idle")} className="flex-1 min-h-[48px] rounded-full bg-surface-2 text-sm font-extrabold cursor-pointer hover:bg-white/10">
                      Voltar
                    </button>
                    <button type="button" onClick={() => setCancelStep("confirm")} className="flex-1 min-h-[48px] rounded-full bg-zero/20 text-zero text-sm font-black cursor-pointer hover:bg-zero/30">
                      Continuar
                    </button>
                  </div>
                </div>
              )}

              {cancelStep === "confirm" && (
                <div className="flex flex-col gap-4">
                  <FormField label={confirmLabel} htmlFor="cfg-confirmar">
                    <input
                      id="cfg-confirmar"
                      type="text"
                      autoComplete="off"
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      placeholder={workspace?.name}
                      autoFocus
                      className={`${inputClass} ring-1 ring-zero/40`}
                    />
                  </FormField>
                  {cancelError && <p role="alert" className="text-sm font-bold text-zero">{cancelError}</p>}
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => { setCancelStep("idle"); setDeleteInput(""); setCancelError(""); }}
                      className="flex-1 min-h-[48px] rounded-full bg-surface-2 text-sm font-extrabold cursor-pointer hover:bg-white/10"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteWorkspace}
                      disabled={deleteInput !== workspace?.name || cancelling}
                      className="flex-1 min-h-[48px] rounded-full bg-zero text-ink text-sm font-black cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {cancelling && <Spinner className="w-4 h-4" />}
                      {cancelling ? "Excluindo…" : "Excluir definitivamente"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

        </div>
      </main>
      {pagandoPlano && workspace && (
        <PagamentoEmbutido
          workspaceId={workspace.id}
          plan={pagandoPlano}
          planLabel={PLAN_CONFIG[pagandoPlano].label}
          onFechar={() => setPagandoPlano(null)}
          onConcluido={() => window.location.reload()}
        />
      )}

      <BottomNav />
    </div>
  );
}
