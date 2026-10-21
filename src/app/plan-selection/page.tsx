"use client";

import { useState } from "react";
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

      /* Basic e Growth começam com 14 dias grátis (EQZ-12); o Pro, ou quem já usou o teste, paga na hora */
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
                trialNote={plan.trialNote}
                selected={selectedPlan === plan.id}
                onSelect={() => setSelectedPlan(plan.id)}
              />
            ))}
          </div>

          <p aria-live="polite" className="min-h-5 text-center text-sm font-bold text-fg-muted mb-6">
            {selected && (
              <>
                Plano <span className="text-fg font-black">{selected.name}</span> selecionado
                {selected.price !== "Grátis" && <> · {selected.price}{selected.priceNote}</>}
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
            <PrimaryButton onClick={handleContinue} loading={loading} disabled={!selectedPlan} className="flex-1">
              Continuar <ArrowRightIcon className="w-5 h-5" strokeWidth={2.4} />
            </PrimaryButton>
          </div>

          <p className="text-center text-[13px] font-bold text-fg-subtle mt-5">
            {selectedPlan !== "pro"
              ? "14 dias grátis, sem cartão · Cancele quando quiser · Sem fidelidade"
              : "O Pro começa pago · Cancele quando quiser · Sem fidelidade"}
          </p>

        </div>
      </div>
    </OnboardingShell>
  );
}
