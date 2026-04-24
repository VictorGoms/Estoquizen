"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Subscription {
  status: "trialing" | "trial_expired" | "active" | "past_due" | "canceled" | "deleted";
  plan: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export default function TrialBanner({ workspaceId }: { workspaceId: string }) {
  const [sub, setSub]         = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    api.get<Subscription>(`/billing/subscription?workspace_id=${workspaceId}`)
      .then(setSub)
      .catch(() => null);
  }, [workspaceId]);

  async function handleCheckout() {
    if (!sub) return;
    setLoading(true);
    try {
      const { url } = await api.post<{ url: string }>("/billing/checkout", {
        workspace_id: workspaceId,
        plan: sub.plan,
      });
      if (url) window.location.href = url;
    } catch {
      setLoading(false);
    }
  }

  async function handlePortal() {
    setLoading(true);
    try {
      const { url } = await api.post<{ url: string }>("/billing/portal", {
        workspace_id: workspaceId,
      });
      if (url) window.location.href = url;
    } catch {
      setLoading(false);
    }
  }

  if (!sub) return null;
  if (sub.status === "active" && !sub.cancel_at_period_end) return null;

  /* ── Conteúdo por status ── */
  let bg      = "rgba(217,119,6,0.12)";
  let border  = "rgba(217,119,6,0.3)";
  let color   = "#FCD34D";
  let icon    = "⏳";
  let title   = "";
  let desc    = "";
  let btnLabel = "Assinar agora";
  let btnAction = handleCheckout;
  let urgent  = false;

  if (sub.status === "trialing" && sub.trial_ends_at) {
    const days = daysUntil(sub.trial_ends_at);
    urgent = days <= 3;
    if (urgent) { bg = "rgba(220,38,38,0.12)"; border = "rgba(220,38,38,0.3)"; color = "#FCA5A5"; icon = "🚨"; }
    title = urgent ? `Seu trial expira em ${days} ${days === 1 ? "dia" : "dias"}!` : `Trial: ${days} ${days === 1 ? "dia" : "dias"} restante${days !== 1 ? "s" : ""}`;
    desc  = "Assine para continuar com acesso completo após o período gratuito.";
  } else if (sub.status === "trial_expired") {
    bg = "rgba(220,38,38,0.12)"; border = "rgba(220,38,38,0.3)"; color = "#FCA5A5"; icon = "🔒"; urgent = true;
    title = "Seu trial expirou";
    desc  = "Você está em modo somente leitura. Assine para criar e editar dados.";
  } else if (sub.status === "past_due") {
    bg = "rgba(220,38,38,0.12)"; border = "rgba(220,38,38,0.3)"; color = "#FCA5A5"; icon = "⚠️"; urgent = true;
    title = "Pagamento pendente";
    desc  = "Não conseguimos processar seu pagamento. Atualize sua forma de pagamento.";
    btnLabel = "Atualizar pagamento"; btnAction = handlePortal;
  } else if (sub.status === "canceled") {
    bg = "rgba(220,38,38,0.12)"; border = "rgba(220,38,38,0.3)"; color = "#FCA5A5"; icon = "🔒"; urgent = true;
    title = "Assinatura cancelada";
    desc  = "Você está em modo somente leitura. Reative para criar e editar dados.";
    btnLabel = "Reativar assinatura"; btnAction = handlePortal;
  } else if (sub.status === "active" && sub.cancel_at_period_end && sub.current_period_end) {
    const days = daysUntil(sub.current_period_end);
    bg = "rgba(217,119,6,0.12)"; border = "rgba(217,119,6,0.3)"; color = "#FCD34D"; icon = "📅";
    title = `Assinatura ativa até ${new Date(sub.current_period_end).toLocaleDateString("pt-BR")}`;
    desc  = `Cancelamento agendado — acesso completo por mais ${days} ${days === 1 ? "dia" : "dias"}.`;
    btnLabel = "Reverter cancelamento"; btnAction = handlePortal;
  }

  if (!title) return null;

  return (
    <div
      className="rounded-2xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-lg flex-shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color }}>{title}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
        </div>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={btnAction}
        className="flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer transition-all duration-200 hover:opacity-90 disabled:opacity-50"
        style={{
          background: urgent ? "linear-gradient(135deg,#DC2626,#B91C1C)" : "linear-gradient(135deg,#2563EB,#1D4ED8)",
          color: "#fff",
        }}
      >
        {loading ? "Aguarde…" : btnLabel}
      </button>
    </div>
  );
}
