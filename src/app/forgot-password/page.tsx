"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AuthLayout from "@/components/auth/AuthLayout";
import InputField from "@/components/auth/InputField";
import PrimaryButton from "@/components/auth/PrimaryButton";
import { MailIcon } from "@/components/ui/icons";

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
      <AuthLayout title="Email enviado" subtitle="Verifique sua caixa de entrada" icon={<MailIcon className="w-7 h-7" />}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-full bg-surface-2 rounded-3xl px-4 py-4">
            <p className="text-sm font-bold text-fg-muted">Enviamos um link de redefinição para</p>
            <p className="text-[15px] font-black text-fg mt-1 break-all">{email}</p>
          </div>
          <p className="text-sm font-semibold text-fg-muted">O link expira em 1 hora.</p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="min-h-[44px] text-sm text-accent hover:brightness-110 font-extrabold cursor-pointer"
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

        {error && <p role="alert" className="text-sm font-bold text-zero text-center">{error}</p>}

        <PrimaryButton type="submit" loading={loading} disabled={!email.trim() || cooldown > 0}>
          {cooldown > 0 ? `Aguarde ${cooldown}s` : "Enviar link de redefinição"}
        </PrimaryButton>

        <p className="text-center text-sm font-bold text-fg-muted">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-accent hover:brightness-110 font-extrabold cursor-pointer"
          >
            Voltar para o login
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
