import Link from "next/link";
import { PLANOS } from "@/lib/planos";

/*
 * Resumo do contrato antes de pagar (EQZ-51, Decreto 7.962, art. 4º, I: destacar as cláusulas que
 * limitam direitos). Fica em cima do formulário do Stripe no PagamentoEmbutido. Mudou uma regra
 * (cancelamento, desistência, guarda dos dados)? Mude aqui e nos Termos.
 */
export default function ResumoContrato({ plan }: { plan: string }) {
  const p = PLANOS.find((x) => x.id === plan);
  const forte = "text-fg font-extrabold";
  return (
    <section aria-label="Resumo da assinatura" className="rounded-4xl bg-surface-2 px-4 py-3.5 text-[13px] font-semibold text-fg-soft leading-relaxed">
      <ul className="flex flex-col gap-1.5 list-disc pl-4 marker:text-fg-subtle">
        <li><strong className={forte}>{p ? `${p.price}${p.priceNote}` : "Mensalidade"}</strong>, renovada todo mês no cartão até você cancelar.</li>
        <li>Cancele quando quiser pelo app: o acesso vai até o fim do mês pago, <strong className={forte}>sem reembolso proporcional</strong>.</li>
        <li>Desistiu em até <strong className={forte}>7 dias</strong> deste pagamento? Devolvemos o valor inteiro.</li>
        <li>Sem assinatura, os dados ficam guardados por <strong className={forte}>30 dias</strong> e depois são excluídos.</li>
      </ul>
      <p className="mt-2">
        Ao pagar, você concorda com os{" "}
        <Link href="/termos" target="_blank" rel="noopener" className="text-accent font-extrabold underline-offset-2 hover:underline">Termos de Uso</Link>.
      </p>
    </section>
  );
}
