"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useRole, can } from "@/hooks/useRole";
import { BellIcon } from "@/components/ui/icons";
import PagamentoEmbutido from "@/components/pagamento/PagamentoEmbutido";
import { pagamentoEmbutido } from "@/lib/pagamento";

interface Subscription {
  status: "trialing" | "trial_expired" | "active" | "past_due" | "canceled" | "deleted";
  plan: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  /* Quando entrou em trial_expired/canceled (trigger subscriptions_track_expiry); base da exclusão */
  expired_at: string | null;
}

const PLAN_LABEL: Record<string, string> = { basic: "Basic", growth: "Growth", pro: "Pro" };

/* O job de limpeza exclui o workspace 30 dias depois do fim da assinatura (com aviso por e-mail antes) */
const DIAS_GUARDADOS = 30;

function guardadoAte(expiredAt: string | null): string {
  if (!expiredAt) return "";
  const ate = new Date(new Date(expiredAt).getTime() + DIAS_GUARDADOS * 24 * 60 * 60 * 1000);
  return ` Os dados ficam guardados até ${ate.toLocaleDateString("pt-BR")}; depois, o workspace é excluído.`;
}

function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export default function TrialBanner({ workspaceId }: { workspaceId: string }) {
  const [sub, setSub]         = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [pagando, setPagando] = useState(false);
  /* A API só aceita checkout e portal do owner; os outros veem o aviso sem o botão */
  const role                  = useRole();
  const canManage             = can(role, "canGerenciarAssinatura");
  const canExport             = can(role, "canAccessConfiguracoes");

  useEffect(() => {
    if (!workspaceId) return;
    api.get<Subscription>(`/billing/subscription?workspace_id=${workspaceId}`)
      .then(setSub)
      .catch(() => null);
  }, [workspaceId]);

  async function handleCheckout() {
    if (!sub) return;
    if (pagamentoEmbutido) { setPagando(true); return; }
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
  let title   = "";
  let desc    = "";
  let btnLabel = "Assinar agora";
  let btnAction = handleCheckout;
  let urgent  = false;

  if (sub.status === "trialing" && sub.trial_ends_at) {
    const days = daysUntil(sub.trial_ends_at);
    urgent = days <= 3;
    title = urgent ? `Seu trial expira em ${days} ${days === 1 ? "dia" : "dias"}!` : `Trial: ${days} ${days === 1 ? "dia" : "dias"} restante${days !== 1 ? "s" : ""}`;
    desc  = "Assine para continuar com acesso completo após o período gratuito.";
  } else if (sub.status === "trial_expired" && !sub.trial_ends_at) {
    /* Sem data de trial = nunca teve trial (Basic/Pro, ou CPF que já usou o trial): falta pagar */
    urgent = true;
    title = "Pagamento pendente";
    desc  = `O pagamento do plano ${PLAN_LABEL[sub.plan] ?? sub.plan} não foi concluído. Você está em modo somente leitura até assinar.${guardadoAte(sub.expired_at)}`;
  } else if (sub.status === "trial_expired") {
    urgent = true;
    title = "Seu trial expirou";
    desc  = `Você está em modo somente leitura. Assine para criar e editar dados.${guardadoAte(sub.expired_at)}`;
  } else if (sub.status === "past_due") {
    urgent = true;
    title = "Pagamento pendente";
    desc  = "Não conseguimos processar seu pagamento. Atualize sua forma de pagamento.";
    btnLabel = "Atualizar pagamento"; btnAction = handlePortal;
  } else if (sub.status === "canceled") {
    urgent = true;
    title = "Assinatura cancelada";
    desc  = `Você está em modo somente leitura. Assine de novo para criar e editar dados.${guardadoAte(sub.expired_at)}`;
    /* Assinatura encerrada não volta pelo portal: é um checkout novo (a API cria outra assinatura) */
    btnLabel = "Assinar de novo"; btnAction = handleCheckout;
  } else if (sub.status === "active" && sub.cancel_at_period_end && sub.current_period_end) {
    const days = daysUntil(sub.current_period_end);
    title = `Assinatura ativa até ${new Date(sub.current_period_end).toLocaleDateString("pt-BR")}`;
    desc  = `Cancelamento agendado — acesso completo por mais ${days} ${days === 1 ? "dia" : "dias"}.`;
    btnLabel = "Reverter cancelamento"; btnAction = handlePortal;
  }

  if (!title) return null;

  /* Somente leitura: dá para levar os dados embora antes de o workspace ser excluído */
  const readOnly = sub.status === "trial_expired" || sub.status === "canceled";

  return (
    <>
    {pagando && (
      <PagamentoEmbutido
        workspaceId={workspaceId}
        plan={sub.plan}
        planLabel={PLAN_LABEL[sub.plan] ?? sub.plan}
        onFechar={() => setPagando(false)}
        onConcluido={() => window.location.reload()}
      />
    )}
    <div
      role={urgent ? "alert" : "status"}
      className={`rounded-4xl px-4 py-3.5 flex items-center justify-between gap-4 flex-wrap ring-1 ${
        urgent ? "bg-zero/10 ring-zero/30" : "bg-low/10 ring-low/30"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${urgent ? "bg-zero/15 text-zero" : "bg-low/15 text-low"}`}>
          <BellIcon className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className={`text-[15px] font-black ${urgent ? "text-zero" : "text-low"}`}>{title}</p>
          <p className="text-[13px] font-bold text-fg-muted mt-0.5 leading-relaxed">{desc}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {readOnly && canExport && (
          <Link
            href="/configuracoes#exportar"
            className="shrink-0 min-h-[44px] px-4 flex items-center rounded-full text-sm font-extrabold text-fg-soft hover:bg-white/5 transition-colors"
          >
            Exportar dados
          </Link>
        )}
        {canManage ? (
          <button
            type="button"
            disabled={loading}
            onClick={btnAction}
            className={`shrink-0 min-h-[44px] px-5 rounded-full text-sm font-black cursor-pointer transition-[filter] hover:brightness-110 disabled:opacity-50 ${
              urgent ? "bg-zero text-ink" : "bg-accent text-ink"
            }`}
          >
            {loading ? "Aguarde…" : btnLabel}
          </button>
        ) : (
          <p className="text-[13px] font-bold text-fg-muted">Fale com o dono do workspace.</p>
        )}
      </div>
    </div>
    </>
  );
}
