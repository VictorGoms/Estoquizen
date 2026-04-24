"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AuthLayout from "@/components/auth/AuthLayout";
import InputField from "@/components/auth/InputField";
import PrimaryButton from "@/components/auth/PrimaryButton";

const COOLDOWN_S = 60;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [error, setError]         = useState("");
  const [cooldown, setCooldown]   = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cooldown > 0) return;
    setLoading(true);
    setError("");

    const clean = email.trim().toLowerCase();

    /* Verifica se o email está cadastrado em auth.users */
    const { data: exists } = await supabase.rpc("email_exists", { p_email: clean });

    if (!exists) {
      setError("Este email não está cadastrado no Estoquizen.");
      setLoading(false);
      return;
    }

    const { error: err } = await supabase.auth.resetPasswordForEmail(clean, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (err) { setError("Não foi possível enviar o email. Tente novamente."); return; }
    setSent(true);
    setCooldown(COOLDOWN_S);
  }

  if (sent) {
    return (
      <AuthLayout title="Email enviado" subtitle="Verifique sua caixa de entrada">
        <div className="flex flex-col items-center gap-5 text-center py-2">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(5,150,105,0.15)", border: "1px solid rgba(16,185,129,0.25)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#6EE7B7" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Enviamos um link de redefinição para <span className="text-white font-medium">{email}</span>.<br />
            O link expira em 1 hora.
          </p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors duration-200 cursor-pointer"
          >
            Voltar para o login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Redefinir senha" subtitle="Enviaremos um link para o seu email">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <InputField
          label="Email"
          id="email"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {error && <p className="text-xs text-red-400 text-center -mb-1">{error}</p>}

        <PrimaryButton type="submit" loading={loading} disabled={!email.trim() || cooldown > 0}>
          {cooldown > 0 ? `Aguarde ${cooldown}s` : "Enviar link de redefinição"}
        </PrimaryButton>

        <p className="text-center text-sm text-slate-500">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-brand-400 hover:text-brand-300 font-medium transition-colors duration-200 cursor-pointer"
          >
            Voltar para o login
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
