"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import PlanCard from "@/components/onboarding/PlanCard";
import PrimaryButton from "@/components/auth/PrimaryButton";
import SecondaryButton from "@/components/workspace/SecondaryButton";
import { api } from "@/lib/api";
import { ArrowRightIcon } from "@/components/ui/icons";
import { PLANOS as PLANS } from "@/lib/planos";
import PagamentoEmbutido from "@/components/pagamento/PagamentoEmbutido";
import { pagamentoEmbutido } from "@/lib/pagamento";
import { GRATIS_ATE, TESTE_GRATIS } from "@/lib/teste";

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);

export default function PlanSelectionPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>("growth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  /* Basic e Pro pagam na hora: dentro do app quando há a chave pública do Stripe */
  const [pagando, setPagando] = useState<{ workspaceId: string; plan: string } | null>(null);
  /* Teste ainda disponível? (2026-10-28) Quem já usou (1 por pessoa e por CPF) vê o preço normal e o aviso
     antes de criar. Com um workspace esperando pagamento, a API recusa criar outro, e a tela avisa antes */
  const [teste, setTeste] = useState<{ disponivel: boolean; pendente: { id: string; name: string } | null } | null>(null);

  useEffect(() => {
    api.get<{ disponivel: boolean; pendente: { id: string; name: string } | null }>("/workspaces/teste-disponivel")
      .then(setTeste)
      .catch(() => {});
  }, []);

  const semTeste = teste?.disponivel === false;
  const pendente = teste?.pendente ?? null;

  async function handleContinue() {
    if (!selectedPlan) return;
    const name = sessionStorage.getItem("pendingWorkspaceName") ?? "Minha Empresa";
    setLoading(true);
    setError("");

    try {
      const cpf = sessionStorage.getItem("pendingCpf") ?? "";
      const body: Record<string, string> = { name, plan: selectedPlan, cpf };
      /* EQZ-13: o ramo escolhido no passo 1 */
      const segment      = sessionStorage.getItem("pendingSegment");
      const segmentOther = sessionStorage.getItem("pendingSegmentOther");
      if (segment) body.segment = segment;
      if (segment === "outro" && segmentOther) body.segment_other = segmentOther;

      /* trial: false = já usou o teste (1 por pessoa e por CPF) ou escolheu o Pro */
      const ws = await api.post<{ id: string; trial?: boolean }>("/workspaces", body);
      sessionStorage.removeItem("pendingWorkspaceName");
      sessionStorage.removeItem("pendingSegment");
      sessionStorage.removeItem("pendingSegmentOther");

      /* Todo plano começa com o teste grátis (lib/teste.ts); só quem já usou o teste paga na hora */
      const pagaAgora = !ws.trial;

      if (pagaAgora && pagamentoEmbutido) {
        setPagando({ workspaceId: ws.id, plan: selectedPlan });
        setLoading(false);
        return;
      }

      if (pagaAgora) {
        const checkout = await api.post<{ url: string }>("/billing/checkout", {
          workspace_id: ws.id,
          plan:         selectedPlan,
        });
        window.location.href = checkout.url;
        return;
      }

      router.push("/select-workspace");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar workspace");
      setLoading(false);
    }
  }

  const selected = PLANS.find((p) => p.id === selectedPlan);

  return (
    <OnboardingShell currentStep={2}>
      {pagando && (
        <PagamentoEmbutido
          workspaceId={pagando.workspaceId}
          plan={pagando.plan}
          planLabel={PLANS.find((p) => p.id === pagando.plan)?.name ?? pagando.plan}
          onFechar={() => router.push("/select-workspace?checkout=canceled")}
          onConcluido={() => router.push("/select-workspace?checkout=success")}
        />
      )}
      <div className="flex flex-col flex-1 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto w-full flex flex-col flex-1">

          <div className="text-center mb-10 flex flex-col gap-2">
            <p className="text-sm font-extrabold text-accent">Passo 2 de 2</p>
            <h1 className="text-[28px] sm:text-[36px] font-black tracking-tight leading-tight">Escolha seu plano</h1>
            <p className="text-[15px] font-bold text-fg-muted">Você pode mudar de plano a qualquer momento.</p>
          </div>

          {pendente ? (
            <div role="status" className="max-w-2xl w-full mx-auto mb-8 rounded-3xl bg-surface-2 px-5 py-4 flex flex-col items-center gap-3 text-center">
              <p className="text-[15px] font-bold text-fg-soft">
                Você já tem o workspace <span className="text-fg font-black">{pendente.name}</span> esperando pagamento.
                Assine por ele ou exclua-o em Configurações antes de criar outro.
              </p>
              <button
                type="button"
                onClick={() => router.push("/select-workspace")}
                className="min-h-[44px] px-5 rounded-full bg-accent text-ink text-sm font-black cursor-pointer hover:brightness-110"
              >
                Ir para a escolha de workspace
              </button>
            </div>
          ) : semTeste && (
            <div role="status" className="max-w-2xl w-full mx-auto mb-8 rounded-3xl bg-surface-2 px-5 py-4 text-center">
              <p className="text-[15px] font-black">Seu teste grátis já foi usado</p>
              <p className="text-sm font-bold text-fg-muted mt-1">
                O teste grátis é 1 por pessoa e por CPF. Este workspace começa pago: escolha o plano e pague para continuar.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch mb-8">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                name={plan.name}
                price={plan.price}
                priceNote={plan.priceNote}
                description={plan.description}
                features={plan.features}
                highlighted={plan.highlighted}
                badge={plan.badge}
                trialNote={semTeste ? undefined : plan.trialNote}
                selected={selectedPlan === plan.id}
                onSelect={() => setSelectedPlan(plan.id)}
              />
            ))}
          </div>

          <p aria-live="polite" className="min-h-5 text-center text-sm font-bold text-fg-muted mb-6">
            {selected && (
              <>
                Plano <span className="text-fg font-black">{selected.name}</span> selecionado
                {selected.trialNote && !semTeste
                  ? <> · grátis até {GRATIS_ATE}, depois {selected.price}{selected.priceNote}</>
                  : <> · {selected.price}{selected.priceNote}</>}
              </>
            )}
          </p>

          {error && <p role="alert" className="text-sm font-bold text-zero text-center mb-3">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row gap-3 w-full max-w-lg mx-auto">
            <SecondaryButton
              icon={<BackIcon />}
              onClick={() => router.push("/register-company")}
              className="sm:w-auto sm:px-7 sm:shrink-0 bg-surface-2! hover:bg-white/10!"
            >
              Voltar
            </SecondaryButton>
            <PrimaryButton onClick={handleContinue} loading={loading} disabled={!selectedPlan || !!pendente} className="flex-1">
              Continuar <ArrowRightIcon className="w-5 h-5" strokeWidth={2.4} />
            </PrimaryButton>
          </div>

          <p className="text-center text-[13px] font-bold text-fg-subtle mt-5">
            {semTeste ? "Cancele quando quiser · Sem fidelidade" : `${TESTE_GRATIS}, sem cartão · Cancele quando quiser · Sem fidelidade`}
          </p>

        </div>
      </div>
    </OnboardingShell>
  );
}
