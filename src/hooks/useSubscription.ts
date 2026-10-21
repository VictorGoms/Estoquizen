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
  /* Pausa (EQZ-07): período bloqueado e o que a API calcula na hora */
  pause_starts_at?:       string | null;
  pause_ends_at?:         string | null;
  pausada?:               boolean;
  pausa_agendada?:        boolean;
  pausa_disponivel?:      boolean;
}

/**
 * Workspace sem acesso: trial vencido sem pagamento, assinatura cancelada ou marcada para exclusão,
 * ou pausa em andamento. A mesma regra do workspace_is_writable() do banco (past_due continua com acesso).
 */
export function estaBloqueada(sub: Subscription | null | undefined): boolean {
  return !!sub && (sub.status === "trial_expired" || sub.status === "canceled" || sub.status === "deleted" || !!sub.pausada);
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

/** Guarda no cache uma assinatura já buscada (a escolha de workspace busca todas), sem refazer o pedido. */
export function guardarSubscription(workspaceId: string, sub: Subscription) {
  return mutate(["subscription", workspaceId], sub, { revalidate: false });
}

/* Último estado conhecido de bloqueio de cada workspace, no navegador: num recarregamento, o
   WorkspaceGate mostra um carregando neutro em vez de piscar a página antes da tela de bloqueio */
const CHAVE_BLOQUEIO = (id: string) => `estoquizen_bloqueado:${id}`;

export function lembrarBloqueio(workspaceId: string, bloqueada: boolean) {
  try {
    if (bloqueada) localStorage.setItem(CHAVE_BLOQUEIO(workspaceId), "1");
    else localStorage.removeItem(CHAVE_BLOQUEIO(workspaceId));
  } catch { /* navegador sem localStorage: só pisca, como antes */ }
}

export function bloqueioLembrado(workspaceId: string): boolean {
  try { return localStorage.getItem(CHAVE_BLOQUEIO(workspaceId)) === "1"; } catch { return false; }
}
