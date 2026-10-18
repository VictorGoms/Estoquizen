"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import InputField from "@/components/auth/InputField";
import PrimaryButton from "@/components/auth/PrimaryButton";
import SecondaryButton from "@/components/workspace/SecondaryButton";
import { ArrowRightIcon } from "@/components/ui/icons";
import { supabase } from "@/lib/supabase";
import { sanitizeText } from "@/lib/sanitize";

const BENEFITS = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    text: "Dados criptografados e seguros",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    text: "Configure em menos de 5 minutos",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    text: "Convide sua equipe depois",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    text: "14 dias gratuitos no Growth, sem cartão",
  },
];

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);


export default function RegisterCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  /* Endereço saiu: era pedido e descartado. O telefone agora vai para o perfil. */
  const [values, setValues] = useState({ name: "", cpf: "", phone: "" });
  const [cpfError, setCpfError] = useState("");

  function formatCpf(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0,3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6)}`;
    return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
  }

  function validateCpf(cpf: string): boolean {
    const d = cpf.replace(/\D/g, "");
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
    let r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    if (r !== parseInt(d[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
    r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    return r === parseInt(d[10]);
  }

  function handleChange(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = field === "cpf" ? formatCpf(e.target.value) : e.target.value;
      setValues((v) => ({ ...v, [field]: val }));
      if (field === "cpf") setCpfError("");
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) return;
    if (values.cpf && !validateCpf(values.cpf)) {
      setCpfError("CPF inválido");
      return;
    }
    sessionStorage.setItem("pendingWorkspaceName", values.name.trim());
    sessionStorage.setItem("pendingCpf", values.cpf.replace(/\D/g, ""));
    setLoading(true);

    const phone = sanitizeText(values.phone, 20);
    if (phone) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from("profiles").update({ phone }).eq("id", user.id);
    }

    router.push("/plan-selection");
  }

  return (
    <OnboardingShell currentStep={1}>
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 lg:py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-5 items-stretch">

          <section className="bg-panel rounded-6xl p-7 lg:p-9 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-extrabold text-accent">Passo 1 de 2</p>
              <h1 className="text-[28px] lg:text-[34px] font-black tracking-tight leading-tight">Cadastre sua empresa</h1>
              <p className="text-[15px] font-bold text-fg-muted leading-relaxed">
                Esses dados identificam a empresa dentro do Estoquizen. Você pode mudar depois nas configurações.
              </p>
            </div>
            <ul className="hidden md:flex flex-col gap-3">
              {BENEFITS.map((b) => (
                <li key={b.text} className="flex items-center gap-3 rounded-3xl bg-surface p-3">
                  <span className="w-10 h-10 rounded-full bg-surface-2 text-accent flex items-center justify-center flex-shrink-0">{b.icon}</span>
                  <span className="text-sm font-bold text-fg-soft">{b.text}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-surface rounded-6xl p-7 lg:p-9">
            <h2 className="text-xl font-black mb-6">Informações da empresa</h2>
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              <InputField
                label="Nome da empresa"
                id="company-name"
                type="text"
                placeholder="Ex.: Mercado Silva"
                autoComplete="organization"
                value={values.name}
                onChange={handleChange("name")}
              />
              <InputField
                label="CPF"
                id="cpf"
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={values.cpf}
                onChange={handleChange("cpf")}
                error={cpfError || undefined}
              />
              <InputField
                label="Telefone para contato (opcional)"
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                autoComplete="tel"
                value={values.phone}
                onChange={handleChange("phone")}
              />

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <SecondaryButton
                  type="button"
                  icon={<BackIcon />}
                  onClick={() => router.push("/select-workspace")}
                  className="sm:w-auto sm:px-7 sm:flex-shrink-0 !bg-surface-2 hover:!bg-white/10"
                >
                  Voltar
                </SecondaryButton>
                <PrimaryButton type="submit" loading={loading} className="flex-1">
                  Continuar <ArrowRightIcon className="w-5 h-5" strokeWidth={2.4} />
                </PrimaryButton>
              </div>
            </form>
          </section>

        </div>
      </div>
    </OnboardingShell>
  );
}
