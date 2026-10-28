"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import InputField from "@/components/auth/InputField";
import PasswordField from "@/components/auth/PasswordField";
import PrimaryButton from "@/components/auth/PrimaryButton";
import SocialButton from "@/components/auth/SocialButton";
import Divider from "@/components/auth/Divider";
import { supabase } from "@/lib/supabase";
import { MIN_PASSWORD, authErrorPt } from "@/lib/authMessages";
import { registrar } from "@/lib/analytics";
import { MailIcon, CheckIcon } from "@/components/ui/icons";
import { TESTE_GRATIS } from "@/lib/teste";
import { senhaVazada, MSG_SENHA_VAZADA } from "@/lib/senhaVazada";
import Captcha, { captchaLigado, MSG_CAPTCHA } from "@/components/auth/Captcha";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  /* CAPTCHA (EQZ-65): o token vale uma tentativa; trocar `captchaVez` gera outro */
  const [captcha, setCaptcha]       = useState<string | null>(null);
  const [captchaVez, setCaptchaVez] = useState(0);
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
  });

  function handleChange(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreedToTerms) {
      setTermsError(true);
      return;
    }
    setTermsError(false);
    /* O campo dizia "Mínimo 8", mas nada checava: valia o mínimo do Supabase (6) */
    if (values.password.length < MIN_PASSWORD) {
      setError(`A senha deve ter pelo menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    if (captchaLigado && !captcha) { setError(MSG_CAPTCHA); return; }
    setLoading(true);
    setError("");

    if (await senhaVazada(values.password)) {
      setError(MSG_SENHA_VAZADA);
      setLoading(false);
      return;
    }

    /* Garante que não há sessão de outro usuário ativa */
    await supabase.auth.signOut({ scope: "local" });

    const { data, error: authError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { name: values.name }, ...(captcha ? { captchaToken: captcha } : {}) },
    });

    setLoading(false);
    setCaptcha(null);
    setCaptchaVez((v) => v + 1);
    if (authError) { setError(authErrorPt(authError.message)); return; }
    registrar("cadastro_criado", { metodo: "email" });   // começo do funil (EQZ-01); Google conta no /auth/callback

    if (data.session) {
      /* Confirmação de email desativada — usuário já está logado */
      router.push("/select-workspace");
    } else {
      /* Confirmação de email ativada — pede para checar a caixa */
      setEmailSent(true);
    }
  }

  if (emailSent) {
    return (
      <AuthLayout title="Verifique seu email" subtitle="Quase lá!" icon={<MailIcon className="w-7 h-7" />}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-full bg-surface-2 rounded-3xl px-4 py-4">
            <p className="text-sm font-bold text-fg-muted">Enviamos um link de confirmação para</p>
            <p className="text-[15px] font-black text-fg mt-1 break-all">{values.email}</p>
          </div>
          <p className="text-sm font-semibold text-fg-muted leading-relaxed max-w-xs">
            Clique no link do email para ativar sua conta. Depois de confirmar, volte aqui para entrar.
          </p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="min-h-[44px] text-sm text-accent hover:brightness-110 font-extrabold cursor-pointer mt-1"
          >
            Já confirmei — ir para o login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Crie sua conta"
      subtitle={`${TESTE_GRATIS} em qualquer plano, sem cartão`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {/* Full name */}
        <InputField
          label="Nome completo"
          id="name"
          type="text"
          placeholder="Seu nome"
          autoComplete="name"
          value={values.name}
          onChange={handleChange("name")}
          required
        />

        {/* Email */}
        <InputField
          label="Email"
          id="email"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          value={values.email}
          onChange={handleChange("email")}
          required
        />

        {/* Password */}
        <PasswordField
          label="Senha"
          id="password"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          value={values.password}
          onChange={handleChange("password")}
          required
        />

        {/* Terms checkbox */}
        <div className="flex flex-col gap-1">
          <label className="flex items-start gap-3 cursor-pointer">
            <span className="relative shrink-0">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={agreedToTerms}
                aria-invalid={termsError ? true : undefined}
                onChange={(e) => {
                  setAgreedToTerms(e.target.checked);
                  if (e.target.checked) setTermsError(false);
                }}
              />
              <span
                aria-hidden="true"
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface ${
                  agreedToTerms ? "bg-accent text-ink" : termsError ? "bg-ink ring-2 ring-zero/70" : "bg-ink ring-1 ring-white/15"
                }`}
              >
                {agreedToTerms && <CheckIcon className="w-4 h-4" strokeWidth={3} />}
              </span>
            </span>
            <span className="text-sm font-semibold text-fg-muted leading-snug pt-0.5">
              Concordo com os{" "}
              {/* Abrem em outra aba para não perder o que já foi digitado */}
              <a href="/termos" target="_blank" rel="noopener" className="text-accent font-extrabold underline-offset-2 hover:underline">
                Termos de uso
              </a>{" "}
              e a{" "}
              <a href="/privacidade" target="_blank" rel="noopener" className="text-accent font-extrabold underline-offset-2 hover:underline">
                Política de privacidade
              </a>
            </span>
          </label>
          {termsError && (
            <p role="alert" className="text-[13px] font-bold text-zero pl-9">
              Você precisa aceitar os termos para continuar.
            </p>
          )}
        </div>

        <Captcha key={captchaVez} onToken={setCaptcha} />

        {/* Error */}
        {error && (
          <p role="alert" className="text-sm font-bold text-zero text-center">{error}</p>
        )}

        {/* Submit */}
        <PrimaryButton type="submit" loading={loading} className="mt-1">
          Cadastrar
        </PrimaryButton>

        <Divider />

        {/* Google */}
        <SocialButton onClick={async () => {
          await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
          });
        }}>
          Continuar com Google
        </SocialButton>

        {/* Footer link */}
        <p className="text-center text-sm font-bold text-fg-muted mt-1">
          Já possui uma conta?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-accent hover:brightness-110 font-extrabold cursor-pointer"
          >
            Entrar
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
