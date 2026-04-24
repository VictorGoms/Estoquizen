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

/* ─── Icons ─── */
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
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
    <div className="min-h-screen bg-navy-900 flex items-center justify-center"><PageLoader /></div>
  );

  const plan = PLAN_CONFIG[workspace?.plan ?? "basic"];
  const limit = workspace?.plan === "pro" ? 2000 : workspace?.plan === "growth" ? 300 : 50;
  const usagePct = Math.min(100, Math.round((productCount / limit) * 100));
  const usageColor = usagePct >= 90 ? "#FCA5A5" : usagePct >= 70 ? "#FCD34D" : "#6EE7B7";

  if (!can(wsRole, "canAccessConfiguracoes")) return <AccessDenied />;

  return (
    <div className="min-h-screen bg-navy-900 relative overflow-hidden">
      <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ width: "700px", height: "350px", background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.09) 0%, transparent 70%)" }}
      />
      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      <main className="lg:pl-60 pt-14 pb-28 md:pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 lg:py-8 flex flex-col gap-6">

            <div className="flex items-center gap-3">
              <button type="button" onClick={() => router.back()}
                className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs font-medium cursor-pointer transition-colors duration-200">
                <ArrowLeftIcon /> Voltar
              </button>
            </div>

            <div>
              <h1 className="font-display font-bold text-xl text-white">Configurações</h1>
              <p className="text-slate-500 text-sm mt-1">Gerencie seu workspace e assinatura</p>
            </div>

            {/* ── Plano & Cobrança ── */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(22,32,52,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>

              <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium mb-3">Plano & Cobrança</p>

                {/* Plan badge + upgrade */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold px-3 py-1 rounded-full"
                      style={{ background: plan.bg, color: plan.color, border: `1px solid ${plan.border}` }}>
                      {plan.label}
                    </span>
                    <span className="text-xs text-slate-500">{plan.limit}</span>
                  </div>
                  {workspace?.plan !== "pro" && (
                    <button
                      type="button"
                      onClick={() => handleUpgrade(workspace?.plan === "basic" ? "growth" : "pro")}
                      disabled={!!upgradingTo}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-1.5 disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", boxShadow: "0 2px 8px rgba(37,99,235,0.4)" }}>
                      {upgradingTo ? "Aguarde…" : workspace?.plan === "basic" ? "Upgrade para Growth" : "Upgrade para Pro"}
                    </button>
                  )}
                </div>
              </div>

              {/* Usage bar */}
              <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">Produtos cadastrados</span>
                  <span className="text-xs font-semibold" style={{ color: usageColor }}>
                    {productCount} / {limit}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${usagePct}%`, background: usageColor }} />
                </div>
              </div>

              {/* Billing actions */}
              <div className="px-5 py-4 flex flex-col gap-2.5">
                <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium mb-1">Faturamento</p>

                {/* Renovação / trial */}
                <div className="flex items-center justify-between py-2"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-xs text-slate-500">
                    {subscription?.status === "trialing" ? "Trial expira em" : "Próxima renovação"}
                  </span>
                  <span className="text-xs font-medium text-slate-300">
                    {subscription?.status === "trialing"
                      ? (formatDate(subscription.trial_ends_at) ?? "—")
                      : subscription?.status === "active"
                      ? (formatDate(subscription.current_period_end) ?? "—")
                      : "—"}
                  </span>
                </div>

                {/* Portal Stripe — só disponível com stripe_customer_id */}
                {subscription?.stripe_customer_id ? (
                  <button type="button" onClick={handlePortal} disabled={portalLoading}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors duration-200 disabled:opacity-60"
                    style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>
                    <span>{portalLoading ? "Abrindo…" : "Gerenciar assinatura"}</span>
                    <ExternalIcon />
                  </button>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl opacity-40"
                    style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <span className="text-xs text-slate-500">Gerenciar assinatura</span>
                    <span className="text-[10px] text-slate-600">Disponível após 1º pagamento</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Informações da empresa ── */}
            <form onSubmit={handleSave}
              className="rounded-2xl p-5 flex flex-col gap-4"
              style={{ background: "rgba(22,32,52,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-sm font-semibold text-white">Informações da empresa</h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Nome da empresa</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white outline-none transition-all duration-200"
                  style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Descrição (opcional)</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3}
                  placeholder="Descreva sua empresa…"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-slate-700 outline-none transition-all duration-200 resize-none"
                  style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button type="submit" disabled={saving || !editName.trim()}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
                style={{ background: saved ? "linear-gradient(135deg,#059669,#047857)" : "linear-gradient(135deg,#2563EB,#1D4ED8)", boxShadow: "0 4px 14px rgba(37,99,235,0.3)" }}>
                {saving
                  ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : saved ? <CheckIcon /> : null}
                {saving ? "Salvando…" : saved ? "Salvo!" : "Salvar alterações"}
              </button>
            </form>

            {/* ── Encerrar assinatura — só owner ── */}
            {can(wsRole, "canEncerrarAssinatura") && <div className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(239,68,68,0.18)" }}>

              <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(239,68,68,0.1)" }}>
                <h3 className="text-sm font-semibold text-red-400">Encerrar assinatura</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Ao encerrar, <strong className="text-slate-400">todos os dados serão excluídos permanentemente</strong> — produtos, movimentações, membros e o workspace. Essa ação não pode ser desfeita.
                </p>
              </div>

              <div className="px-5 py-4">
                {cancelStep === "idle" && (
                  <button type="button" onClick={() => setCancelStep("warn")}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200"
                    style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#FCA5A5" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.18)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.1)"; }}>
                    Encerrar assinatura
                  </button>
                )}

                {cancelStep === "warn" && (
                  <div className="flex flex-col gap-4">
                    <div className="rounded-xl p-4 flex flex-col gap-2"
                      style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <p className="text-sm font-semibold text-white">Tem certeza absoluta?</p>
                      <ul className="text-xs text-slate-500 flex flex-col gap-1 list-disc list-inside leading-relaxed">
                        <li>Todos os <strong className="text-slate-400">{productCount} produto(s)</strong> serão excluídos</li>
                        <li>Todo o histórico de movimentações será apagado</li>
                        <li>Todos os membros perderão o acesso</li>
                        <li>Não é possível recuperar os dados depois</li>
                      </ul>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setCancelStep("idle")}
                        className="flex-1 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
                        style={{ background: "rgba(255,255,255,0.06)", color: "#64748B" }}>
                        Voltar
                      </button>
                      <button type="button" onClick={() => setCancelStep("confirm")}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                        style={{ background: "rgba(220,38,38,0.4)", color: "#FCA5A5" }}>
                        Continuar
                      </button>
                    </div>
                  </div>
                )}

                {cancelStep === "confirm" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xs text-slate-400">
                        Digite <span className="font-bold text-red-400">{workspace?.name}</span> para confirmar:
                      </p>
                      <input type="text" value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)}
                        placeholder={workspace?.name}
                        autoFocus
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-slate-700 outline-none transition-all duration-200"
                        style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(239,68,68,0.4)" }}
                      />
                    </div>

                    {cancelError && <p className="text-xs text-red-400">{cancelError}</p>}

                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setCancelStep("idle"); setDeleteInput(""); setCancelError(""); }}
                        className="flex-1 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
                        style={{ background: "rgba(255,255,255,0.06)", color: "#64748B" }}>
                        Cancelar
                      </button>
                      <button type="button"
                        onClick={handleCancelSubscription}
                        disabled={deleteInput !== workspace?.name || cancelling}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{ background: "rgba(220,38,38,0.6)", color: "#FCA5A5" }}>
                        {cancelling && <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                        {cancelling ? "Encerrando…" : "Encerrar definitivamente"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>}

          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
