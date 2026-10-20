"use client";

import useSWR, { mutate } from "swr";
import { api } from "@/lib/api";

export type SubscriptionStatus = "trialing" | "trial_expired" | "active" | "past_due" | "canceled" | "deleted";

export interface Subscription {
  status:                 SubscriptionStatus;
  plan:                   string;
  trial_ends_at:          string | null;
  current_period_end:     string | null;
  cancel_at_period_end:   boolean;
  /* Quando entrou em trial_expired/canceled (trigger subscriptions_track_expiry); base da exclusão */
  expired_at:             string | null;
  stripe_customer_id:     string | null;
  stripe_subscription_id: string | null;
}

/**
 * Workspace sem acesso: trial vencido sem pagamento, assinatura cancelada ou marcada para exclusão.
 * A mesma regra do workspace_is_writable() do banco (past_due continua com acesso).
 */
export function estaBloqueada(sub: Subscription | null | undefined): boolean {
  return !!sub && (sub.status === "trial_expired" || sub.status === "canceled" || sub.status === "deleted");
}

/* O job de limpeza exclui o workspace 30 dias depois do fim da assinatura (com aviso por e-mail antes) */
export const DIAS_GUARDADOS = 30;

/** Data a partir da qual o workspace pode ser excluído, ou null se a assinatura não terminou. */
export function guardadoAte(sub: Subscription | null | undefined): Date | null {
  if (!sub?.expired_at) return null;
  return new Date(new Date(sub.expired_at).getTime() + DIAS_GUARDADOS * 24 * 60 * 60 * 1000);
}

/** Assinatura do workspace (a API também vence o trial na hora). null sem assinatura ou se falhar. */
export function useSubscription(workspaceId: string | null | undefined) {
  const { data, isLoading } = useSWR(
    workspaceId ? ["subscription", workspaceId] : null,
    () => api.get<Subscription>(`/billing/subscription?workspace_id=${workspaceId}`).catch(() => null),
    { dedupingInterval: 60 * 1000 },
  );
  return { sub: data ?? null, loading: isLoading };
}

export function mutateSubscription(workspaceId: string) {
  return mutate(["subscription", workspaceId]);
}
