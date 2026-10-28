"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authErrorPt } from "@/lib/authMessages";
import AuthLayout from "@/components/auth/AuthLayout";
import InputField from "@/components/auth/InputField";
import PrimaryButton from "@/components/auth/PrimaryButton";
import Captcha, { captchaLigado, MSG_CAPTCHA } from "@/components/auth/Captcha";
import { MailIcon } from "@/components/ui/icons";

const COOLDOWN_S = 60;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [error, setError]         = useState("");
  const [cooldown, setCooldown]   = useState(0);
  /* CAPTCHA (EQZ-65): o token vale uma tentativa; trocar `captchaVez` gera outro */
  const [captcha, setCaptcha]       = useState<string | null>(null);
  const [captchaVez, setCaptchaVez] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cooldown > 0) return;
    if (captchaLigado && !captcha) { setError(MSG_CAPTCHA); return; }
    setLoading(true);
    setError("");

    const clean = email.trim().toLowerCase();

    /* Não consulta mais se o e-mail existe: dizer "não está cadastrado" deixava qualquer pessoa
       descobrir quem tem conta. O Supabase só envia se a conta existir; a resposta é a mesma. */
    const { error: err } = await supabase.auth.resetPasswordForEmail(clean, {
      redirectTo: `${window.location.origin}/reset-password`,
      ...(captcha ? { captchaToken: captcha } : {}),
    });

    setLoading(false);
    setCaptcha(null);
    setCaptchaVez((v) => v + 1);
    if (err) { setError(authErrorPt(err.message)); return; }
    setSent(true);
    setCooldown(COOLDOWN_S);
  }

  if (sent) {
    return (
      <AuthLayout title="Email enviado" subtitle="Verifique sua caixa de entrada" icon={<MailIcon className="w-7 h-7" />}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-full bg-surface-2 rounded-3xl px-4 py-4">
            <p className="text-sm font-bold text-fg-muted">Se houver uma conta com este e-mail, enviamos um link de redefinição para</p>
            <p className="text-[15px] font-black text-fg mt-1 break-all">{email}</p>
          </div>
          <p className="text-sm font-semibold text-fg-muted">O link expira em 1 hora. Não chegou? Confira o spam.</p>
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

        <Captcha key={captchaVez} onToken={setCaptcha} />

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
