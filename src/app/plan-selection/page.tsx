"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import PlanCard from "@/components/onboarding/PlanCard";
import PrimaryButton from "@/components/auth/PrimaryButton";
import SecondaryButton from "@/components/workspace/SecondaryButton";
import { api } from "@/lib/api";
import { ArrowRightIcon } from "@/components/ui/icons";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: "R$ 19,90",
    priceNote: "/mês",
    description: "Para começar sem complicação",
    highlighted: false,
    badge: undefined,
    trialNote: undefined,
    features: [
      { text: "Até 50 produtos", included: true },
      { text: "Até 3 membros", included: true },
      { text: "Controle de estoque", included: true },
      { text: "Scanner de código de barras", included: true },
      { text: "Alertas de estoque baixo", included: true },
      { text: "Visão geral do estoque", included: true },
      { text: "Importação por XML / NFC-e", included: false },
      { text: "Relatórios e análises de crescimento", included: false },
      { text: "Suporte prioritário", included: false },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "R$ 29,90",
    priceNote: "/mês",
    description: "Para negócios em crescimento",
    highlighted: true,
    badge: "Mais popular",
    trialNote: "14 dias grátis",
    features: [
      { text: "Até 300 produtos", included: true },
      { text: "Até 7 membros", included: true },
      { text: "Controle de estoque", included: true },
      { text: "Scanner de código de barras", included: true },
      { text: "Alertas de estoque baixo", included: true },
      { text: "Visão geral do estoque", included: true },
      { text: "Importação por XML e NFC-e (SP)", included: true },
      { text: "Relatórios e análises de crescimento", included: true },
      { text: "Suporte prioritário", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 59,90",
    priceNote: "/mês",
    description: "Para operações completas",
    highlighted: false,
    badge: undefined,
    trialNote: undefined,
    features: [
      { text: "Até 2.000 produtos", included: true },
      { text: "Até 12 membros", included: true },
      { text: "Controle de estoque", included: true },
      { text: "Scanner de código de barras", included: true },
      { text: "Alertas de estoque baixo", included: true },
      { text: "Visão geral do estoque", included: true },
      { text: "Importação por XML e NFC-e (SP)", included: true },
      { text: "Relatórios e análises de crescimento", included: true },
      { text: "Suporte prioritário", included: true },
    ],
  },
];

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

  async function handleContinue() {
    if (!selectedPlan) return;
    const name = sessionStorage.getItem("pendingWorkspaceName") ?? "Minha Empresa";
    setLoading(true);
    setError("");

    try {
      const cpf = sessionStorage.getItem("pendingCpf") ?? "";
      const body: Record<string, string> = { name, plan: selectedPlan, cpf };

      const ws = await api.post<{ id: string }>("/workspaces", body);
      sessionStorage.removeItem("pendingWorkspaceName");

      if (selectedPlan !== "growth") {
        /* basic e pro não têm trial — redireciona direto para o checkout */
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
              className="sm:w-auto sm:px-7 sm:flex-shrink-0 !bg-surface-2 hover:!bg-white/10"
            >
              Voltar
            </SecondaryButton>
            <PrimaryButton onClick={handleContinue} loading={loading} disabled={!selectedPlan} className="flex-1">
              Continuar <ArrowRightIcon className="w-5 h-5" strokeWidth={2.4} />
            </PrimaryButton>
          </div>

          <p className="text-center text-[13px] font-bold text-fg-subtle mt-5">
            {selectedPlan === "growth"
              ? "14 dias grátis no Growth · Cancele quando quiser · Sem fidelidade"
              : "Pagamento necessário para ativar · Cancele quando quiser · Sem fidelidade"}
          </p>

        </div>
      </div>
    </OnboardingShell>
  );
}
