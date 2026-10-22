"use client";

import { useEffect, useRef, useState } from "react";
import type { Stripe } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js/pure";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { api } from "@/lib/api";
import { CHAVE_STRIPE } from "@/lib/pagamento";
import { registrar } from "@/lib/analytics";
import ResumoContrato from "./ResumoContrato";
import { XIcon, CheckIcon, Spinner } from "@/components/ui/icons";

/* Carrega o Stripe.js uma vez só, e só quando alguém for pagar. O "pure" importa: o pacote normal
   injeta o script do Stripe (com cookie de terceiro) assim que é importado, e este componente entra
   no layout de todas as páginas pela tela de bloqueio, inclusive na landing */
let stripePromise: Promise<Stripe | null> | null = null;
const obterStripe = () => (stripePromise ??= loadStripe(CHAVE_STRIPE));

interface PagamentoEmbutidoProps {
  workspaceId: string;
  plan:        string;
  planLabel:   string;
  /** Fechou sem pagar */
  onFechar:    () => void;
  /** Pagou e o webhook já ativou o plano (ou passou o tempo de espera) */
  onConcluido: () => void;
}

type Fase = "carregando" | "pagando" | "ativando" | "erro";

/**
 * Pagamento da assinatura dentro do app: o formulário do Stripe aparece num quadro sobre a página.
 * Quem já paga e troca de plano recebe da API o link do portal (com o valor proporcional) e vai
 * para lá, como antes. Depois de pagar com cartão a pessoa fica no app; o plano é ativado pelo
 * webhook, então a tela espera a assinatura ficar ativa antes de seguir.
 */
export default function PagamentoEmbutido({ workspaceId, plan, planLabel, onFechar, onConcluido }: PagamentoEmbutidoProps) {
  const [fase, setFase]     = useState<Fase>("carregando");
  const [segredo, setSegredo] = useState<string | null>(null);
  const [erro, setErro]     = useState("");
  const fecharRef = useRef<HTMLButtonElement>(null);
  const vivo      = useRef(true);

  useEffect(() => {
    vivo.current = true;
    api.post<{ client_secret?: string; url?: string }>("/billing/checkout", { workspace_id: workspaceId, plan, embutido: true })
      .then((r) => {
        if (!vivo.current) return;
        if (r.url) { window.location.assign(r.url); return; }   // troca de plano: confirmação no portal
        setSegredo(r.client_secret ?? null);
        setFase("pagando");
      })
      .catch((err) => {
        if (!vivo.current) return;
        /* Ex.: 409 quando os produtos ou a equipe não cabem no plano escolhido */
        setErro(err instanceof Error ? err.message : "Não foi possível abrir o pagamento. Tente novamente.");
        setFase("erro");
      });
    return () => { vivo.current = false; };
  }, [workspaceId, plan]);

  useEffect(() => {
    fecharRef.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape" && fase !== "ativando") onFechar(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [fase, onFechar]);

  /* Pagamento aprovado: espera o webhook marcar a assinatura como ativa (até ~40 s) */
  async function aoConcluir() {
    setFase("ativando");
    registrar("assinou", { plano: plan });   // fim do funil (EQZ-01)
    for (let i = 0; i < 20 && vivo.current; i++) {
      const s = await api.get<{ status: string; plan: string }>(`/billing/subscription?workspace_id=${workspaceId}`).catch(() => null);
      if (s && s.status === "active" && s.plan === plan) break;
      await new Promise((r) => setTimeout(r, 2000));
    }
    if (vivo.current) onConcluido();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <button type="button" aria-label="Fechar" tabIndex={-1} onClick={() => fase !== "ativando" && onFechar()} className="absolute inset-0 bg-ink/80 cursor-default" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pagamento-titulo"
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-surface rounded-t-5xl sm:rounded-5xl p-4 sm:p-5 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between gap-3 px-1">
          <h2 id="pagamento-titulo" className="text-lg font-black">Assinar o {planLabel}</h2>
          <button
            ref={fecharRef}
            type="button"
            onClick={onFechar}
            disabled={fase === "ativando"}
            aria-label="Fechar"
            className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center cursor-pointer hover:bg-white/10 disabled:opacity-40"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {fase === "carregando" && (
          <p role="status" className="py-16 flex items-center justify-center gap-2 text-sm font-bold text-fg-muted">
            <Spinner className="w-5 h-5" /> Abrindo o pagamento…
          </p>
        )}

        {fase === "erro" && (
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <p role="alert" className="text-sm font-bold text-zero">{erro}</p>
            <button type="button" onClick={onFechar} className="min-h-[44px] px-5 rounded-full bg-surface-2 text-sm font-extrabold cursor-pointer hover:bg-white/10">
              Voltar
            </button>
          </div>
        )}

        {(fase === "carregando" || fase === "pagando") && <ResumoContrato plan={plan} />}

        {fase === "pagando" && segredo && (
          /* O Stripe desenha o formulário num iframe claro: o fundo branco evita a borda escura em volta */
          <div className="bg-white rounded-4xl overflow-hidden min-h-[420px]">
            <EmbeddedCheckoutProvider stripe={obterStripe()} options={{ clientSecret: segredo, onComplete: aoConcluir }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}

        {fase === "ativando" && (
          <div role="status" className="py-14 flex flex-col items-center gap-4 text-center">
            <span className="w-16 h-16 rounded-full bg-ok/15 text-ok flex items-center justify-center">
              <CheckIcon className="w-8 h-8" strokeWidth={2.6} />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-xl font-black">Pagamento aprovado</p>
              <p className="flex items-center justify-center gap-2 text-sm font-bold text-fg-muted">
                <Spinner className="w-4 h-4" /> Ativando o plano {planLabel}…
              </p>
            </div>
          </div>
        )}

        <p className="px-1 text-[12px] font-bold text-fg-subtle text-center">
          Pagamento processado pelo Stripe. Os dados do cartão vão direto para eles, sem passar pelo Estoquizen.
        </p>
      </div>
    </div>
  );
}
