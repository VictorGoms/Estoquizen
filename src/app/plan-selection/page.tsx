"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import PlanCard from "@/components/onboarding/PlanCard";
import PrimaryButton from "@/components/auth/PrimaryButton";
import SecondaryButton from "@/components/workspace/SecondaryButton";
import { api } from "@/lib/api";

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
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleContinue() {
    if (!selectedPlan) return;
    const name = sessionStorage.getItem("pendingWorkspaceName") ?? "Minha Empresa";
    setLoading(true);
    setError("");

    try {
      const body: Record<string, string> = { name, plan: selectedPlan, cpf: cpf.replace(/\D/g, "") };

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

          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-brand-400 text-xs font-semibold uppercase tracking-widest mb-2">
              Passo 2 de 2
            </p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white">
              Escolha seu plano
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Você pode mudar de plano a qualquer momento.
            </p>
          </div>

          {/* Plans grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch mb-8 mt-4">
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

          {/* CPF — obrigatório para todos os planos */}
          {selectedPlan && (
            <div className="max-w-sm mx-auto w-full mb-2">
              <label className="block text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-1.5">
                CPF <span className="text-brand-400">*</span>
                {selectedPlan === "growth" && (
                  <span className="normal-case font-normal text-slate-600 ml-1">— 1 trial gratuito por CPF</span>
                )}
              </label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 11);
                  setCpf(v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
                           .replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3")
                           .replace(/(\d{3})(\d{1,3})/, "$1.$2"));
                }}
                placeholder="000.000.000-00"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-slate-700 outline-none transition-all duration-200"
                style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>
          )}

          {/* Selected hint */}
          <div className="h-5 text-center mb-6">
            {selected && (
              <p className="text-xs text-slate-600">
                Plano{" "}
                <span className="text-brand-400 font-semibold">{selected.name}</span>{" "}
                selecionado
                {selected.price !== "Grátis" && (
                  <span className="text-slate-600">
                    {" "}— {selected.price}{selected.priceNote}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400 text-center mb-2">{error}</p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg mx-auto">
            <SecondaryButton
              icon={<BackIcon />}
              onClick={() => router.push("/register-company")}
              className="sm:w-auto sm:flex-shrink-0"
            >
              Voltar
            </SecondaryButton>
            <PrimaryButton
              onClick={handleContinue}
              loading={loading}
              disabled={!selectedPlan || cpf.replace(/\D/g, "").length !== 11}
              className="flex-1"
            >
              {!loading && (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
              Continuar
            </PrimaryButton>
          </div>

          {/* Reassurance line */}
          <p className="text-center text-xs text-slate-700 mt-5">
            {selectedPlan === "growth"
              ? <>Trial grátis de 30 dias no Growth&nbsp;&nbsp;•&nbsp;&nbsp;Cancele quando quiser&nbsp;&nbsp;•&nbsp;&nbsp;Sem fidelidade</>
              : <>Pagamento necessário para ativar&nbsp;&nbsp;•&nbsp;&nbsp;Cancele quando quiser&nbsp;&nbsp;•&nbsp;&nbsp;Sem fidelidade</>
            }
          </p>

        </div>
      </div>
    </OnboardingShell>
  );
}
