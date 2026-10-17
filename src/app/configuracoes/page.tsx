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
import { clearSession } from "@/lib/session";
import { useRole, can } from "@/hooks/useRole";
import AccessDenied from "@/components/ui/AccessDenied";
import FormField, { inputClass } from "@/components/ui/FormField";
import { CheckIcon, Spinner } from "@/components/ui/icons";

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

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  plan: Plan;
}

/* ─── Cancellation steps ─── */
type CancelStep = "idle" | "warn" | "confirm";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const wsRole = useRole();

  const [wsName, setWsName]   = useState("");
  const [userName, setUserName] = useState("");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");

  const [subscription, setSubscription] = useState<{
    status: string;
    trial_ends_at: string | null;
    current_period_end: string | null;
    stripe_customer_id: string | null;
    cancel_at_period_end: boolean;
  } | null>(null);
  const [upgradingTo, setUpgradingTo]   = useState<Plan | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

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

      const [wsResult, countResult, subResult] = await Promise.all([
        supabase.from("workspaces").select("id, name, description, plan").eq("id", ws.id).single(),
        supabase.from("products").select("*", { count: "exact", head: true }).eq("workspace_id", ws.id),
        api.get<{ status: string; trial_ends_at: string | null; current_period_end: string | null; stripe_customer_id: string | null; cancel_at_period_end: boolean } | null>(
          `/billing/subscription?workspace_id=${ws.id}`
        ).catch(() => null),
      ]);

      if (wsResult.data) {
        const w = wsResult.data as Workspace;
        setWorkspace(w);
        setWsName(w.name);
        setEditName(w.name);
        setEditDesc(w.description ?? "");
      }
      setProductCount(countResult.count ?? 0);
      if (subResult) setSubscription(subResult);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleUpgrade(plan: Plan) {
    if (!workspace) return;
    setUpgradingTo(plan);
    try {
      const { url } = await api.post<{ url: string }>("/billing/checkout", {
        workspace_id: workspace.id,
        plan,
      });
      window.location.href = url;
    } catch {
      setUpgradingTo(null);
    }
  }

  async function handlePortal() {
    if (!workspace) return;
    setPortalLoading(true);
    try {
      const { url } = await api.post<{ url: string }>("/billing/portal", {
        workspace_id: workspace.id,
      });
      window.location.href = url;
    } catch {
      setPortalLoading(false);
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

    const { error: err } = await supabase
      .from("workspaces")
      .update({ name: editName.trim(), description: editDesc.trim() || null })
      .eq("id", workspace.id);

    setSaving(false);
    if (err) { setError(err.message); return; }

    setWorkspace((w) => w ? { ...w, name: editName.trim(), description: editDesc.trim() || null } : w);
    setWsName(editName.trim());

    const stored = getWorkspace();
    if (stored) {
      const { setWorkspace: setWs } = await import("@/hooks/useWorkspace");
      setWs({ id: stored.id, name: editName.trim(), role: stored.role });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleCancelSubscription() {
    if (!workspace || deleteInput !== workspace.name) return;
    setCancelling(true);
    setCancelError("");

    try {
      await api.delete(`/workspaces/${workspace.id}`);
      clearSession();
      clearWorkspace();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Erro ao encerrar assinatura.");
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
              {workspace?.plan !== "pro" && (
                <button
                  type="button"
                  onClick={() => handleUpgrade(workspace?.plan === "basic" ? "growth" : "pro")}
                  disabled={!!upgradingTo}
                  className="min-h-[44px] px-5 rounded-full bg-accent text-ink text-sm font-black cursor-pointer hover:brightness-110 transition-[filter] disabled:opacity-60"
                >
                  {upgradingTo ? "Aguarde…" : workspace?.plan === "basic" ? "Mudar para Growth" : "Mudar para Pro"}
                </button>
              )}
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
              <div className="flex items-center justify-between gap-3 py-3 border-t-2 border-dashed border-white/[0.08] text-sm">
                <dt className="font-bold text-fg-muted">{subscription?.status === "trialing" ? "Trial expira em" : "Próxima renovação"}</dt>
                <dd className="font-extrabold">
                  {subscription?.status === "trialing"
                    ? (formatDate(subscription.trial_ends_at) ?? "—")
                    : subscription?.status === "active"
                    ? (formatDate(subscription.current_period_end) ?? "—")
                    : "—"}
                </dd>
              </div>
            </dl>

            {subscription?.stripe_customer_id ? (
              <button
                type="button"
                onClick={handlePortal}
                disabled={portalLoading}
                className="w-full min-h-[52px] flex items-center justify-between px-5 rounded-full bg-surface-2 text-[15px] font-extrabold cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-60"
              >
                <span>{portalLoading ? "Abrindo…" : "Gerenciar assinatura e pagamento"}</span>
                <ExternalIcon />
              </button>
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

          {/* ── Encerrar assinatura — só owner ── */}
          {can(wsRole, "canEncerrarAssinatura") && (
            <section aria-labelledby="cfg-encerrar" className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-4 ring-1 ring-zero/25">
              <div className="flex flex-col gap-1.5">
                <h2 id="cfg-encerrar" className="text-lg font-black text-zero">Encerrar assinatura</h2>
                <p className="text-sm font-semibold text-fg-muted leading-relaxed">
                  Ao encerrar, <strong className="text-fg font-extrabold">todos os dados são excluídos para sempre</strong>: produtos, movimentações, membros e o workspace.
                </p>
              </div>

              {cancelStep === "idle" && (
                <button
                  type="button"
                  onClick={() => setCancelStep("warn")}
                  className="min-h-[48px] rounded-full bg-zero/10 text-zero text-[15px] font-extrabold cursor-pointer hover:bg-zero/20 transition-colors"
                >
                  Encerrar assinatura
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
                      onClick={handleCancelSubscription}
                      disabled={deleteInput !== workspace?.name || cancelling}
                      className="flex-1 min-h-[48px] rounded-full bg-zero text-ink text-sm font-black cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {cancelling && <Spinner className="w-4 h-4" />}
                      {cancelling ? "Encerrando…" : "Encerrar definitivamente"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

        </div>
      </main>
      <BottomNav />
    </div>
  );
}
