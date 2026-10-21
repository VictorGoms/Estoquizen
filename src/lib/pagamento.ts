import { api } from "@/lib/api";

/*
 * Pagamento dentro do app (Checkout incorporado do Stripe, decisão do João em 2026-10-21). O cartão
 * é digitado no quadro do próprio Stripe embutido na página: o dado vai direto para eles e nunca
 * passa pelo nosso servidor. Precisa da chave PÚBLICA (pk_...) em NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
 * sem ela, o app abre a página do Stripe como antes.
 */
export const CHAVE_STRIPE = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
export const pagamentoEmbutido = CHAVE_STRIPE.startsWith("pk_");

/** Sem a chave pública: vai para a página do Stripe (ou para a troca de plano no portal). */
export async function abrirCheckoutHospedado(workspaceId: string, plan: string) {
  const { url } = await api.post<{ url: string }>("/billing/checkout", { workspace_id: workspaceId, plan });
  window.location.assign(url);
}
