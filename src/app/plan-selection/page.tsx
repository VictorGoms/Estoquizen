"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import PlanCard from "@/components/onboarding/PlanCard";
import PrimaryButton from "@/components/auth/PrimaryButton";
import SecondaryButton from "@/components/workspace/SecondaryButton";
import { supabase } from "@/lib/supabase";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: "R$ 19",
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
    id: "intermediate",
    name: "Growth",
    price: "R$ 29",
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
    price: "R$ 59",
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
  const [selectedPlan, setSelectedPlan] = useState<string | null>("intermediate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleContinue() {
    if (!selectedPlan) return;
    const name = sessionStorage.getItem("pendingWorkspaceName") ?? "Minha Empresa";
    setLoading(true);
    setError("");

    try {
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr || !session) throw new Error("Sessão expirada. Faça login novamente.");

      const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const headers = {
        "Content-Type":  "application/json",
        "apikey":        anon,
        "Authorization": `Bearer ${session.access_token}`,
        "Prefer":        "return=representation",
      };
      const userId = session.user.id;

      const wsRes = await fetch(`${url}/rest/v1/workspaces?select=*`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name, plan: selectedPlan, created_by: userId }),
      });
      if (!wsRes.ok) {
        const e = await wsRes.json().catch(() => ({}));
        throw new Error(e.message ?? "Erro ao criar workspace");
      }
      const [ws] = await wsRes.json();

      const memberRes = await fetch(`${url}/rest/v1/workspace_members`, {
        method: "POST",
        headers,
        body: JSON.stringify({ workspace_id: ws.id, user_id: userId, role: "owner", status: "ativo" }),
      });
      if (!memberRes.ok) {
        const e = await memberRes.json().catch(() => ({}));
        throw new Error(e.message ?? "Erro ao adicionar membro");
      }

      sessionStorage.removeItem("pendingWorkspaceName");
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
              disabled={!selectedPlan}
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
            14 dias grátis no plano Growth&nbsp;&nbsp;•&nbsp;&nbsp;Cancele quando quiser&nbsp;&nbsp;•&nbsp;&nbsp;Sem fidelidade
          </p>

        </div>
      </div>
    </OnboardingShell>
  );
}
