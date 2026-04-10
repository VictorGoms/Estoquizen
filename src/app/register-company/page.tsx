"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import InputField from "@/components/auth/InputField";
import PrimaryButton from "@/components/auth/PrimaryButton";
import SecondaryButton from "@/components/workspace/SecondaryButton";

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
    text: "14 dias gratuitos, sem cartão",
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
  const [values, setValues] = useState({ name: "", cpf: "", address: "", phone: "" });
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) return;
    if (values.cpf && !validateCpf(values.cpf)) {
      setCpfError("CPF inválido");
      return;
    }
    sessionStorage.setItem("pendingWorkspaceName", values.name.trim());
    setLoading(true);
    router.push("/plan-selection");
  }

  return (
    <OnboardingShell currentStep={1}>
      <div className="flex flex-col flex-1">

        {/* ─── Form ─── */}
        <div className="flex flex-col md:flex-row flex-1">

          {/* Left panel — info (desktop only) */}
          <div
            className="hidden md:flex w-80 lg:w-96 flex-shrink-0 flex-col justify-between p-10 lg:p-12"
            style={{
              background: "rgba(15,23,42,0.6)",
              borderRight: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div>
              <p className="text-brand-400 text-xs font-semibold uppercase tracking-widest mb-3">
                Passo 1 de 2
              </p>
              <h2 className="font-display font-bold text-2xl lg:text-3xl text-white leading-snug">
                Cadastre sua empresa
              </h2>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                Essas informações serão usadas no seu perfil de empresa dentro
                do Estoquizen.
              </p>

              <ul className="mt-8 flex flex-col gap-4">
                {BENEFITS.map((b) => (
                  <li key={b.text} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-brand-400"
                      style={{
                        background: "rgba(29,78,216,0.15)",
                        border: "1px solid rgba(59,130,246,0.15)",
                      }}
                    >
                      {b.icon}
                    </div>
                    <span className="text-sm text-slate-400">{b.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Decorative chart bars */}
            <div
              className="mt-10 rounded-xl p-4 flex items-end gap-1.5 h-20"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
              aria-hidden="true"
            >
              {[35, 55, 40, 75, 60, 85, 70, 90, 65, 80].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm"
                  style={{
                    height: `${h}%`,
                    background:
                      i === 9
                        ? "linear-gradient(180deg,#3B82F6,#2563EB)"
                        : "rgba(59,130,246,0.22)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right panel — form */}
          <div className="flex-1 flex items-center justify-center px-5 py-8 md:p-10 lg:p-16">
            <div className="w-full max-w-md">
              <h3 className="font-display font-bold text-xl text-white mb-6">
                Informações da empresa
              </h3>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                <InputField
                  label="Nome da empresa"
                  id="company-name"
                  type="text"
                  placeholder="Ex: Loja do João LTDA"
                  autoComplete="organization"
                  value={values.name}
                  onChange={handleChange("name")}
                />
                <div className="flex flex-col gap-1">
                  <InputField
                    label="CPF"
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={values.cpf}
                    onChange={handleChange("cpf")}
                  />
                  {cpfError && <p className="text-xs text-red-400 pl-1">{cpfError}</p>}
                </div>
                <InputField
                  label="Endereço"
                  id="address"
                  type="text"
                  placeholder="Rua, número, cidade — UF"
                  autoComplete="street-address"
                  value={values.address}
                  onChange={handleChange("address")}
                />
                <InputField
                  label="Telefone"
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  autoComplete="tel"
                  value={values.phone}
                  onChange={handleChange("phone")}
                />

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <SecondaryButton
                    type="button"
                    icon={<BackIcon />}
                    onClick={() => router.push("/select-workspace")}
                    className="sm:w-auto sm:flex-shrink-0"
                  >
                    Voltar
                  </SecondaryButton>
                  <PrimaryButton
                    type="submit"
                    loading={loading}
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
              </form>
            </div>
          </div>

        </div>
      </div>
    </OnboardingShell>
  );
}
