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

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
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
    setLoading(true);
    setError("");

    /* Garante que não há sessão de outro usuário ativa */
    await supabase.auth.signOut();

    const { data, error: authError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { name: values.name } },
    });

    setLoading(false);
    if (authError) { setError(authError.message); return; }

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
      <AuthLayout title="Verifique seu email" subtitle="Quase lá!">
        <div className="flex flex-col items-center gap-5 py-4 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(29,78,216,0.15)", border: "1px solid rgba(59,130,246,0.2)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Enviamos um link de confirmação para
            </p>
            <p className="text-sm font-semibold text-white mt-0.5">{values.email}</p>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed max-w-xs">
              Clique no link do email para ativar sua conta. Após confirmar, volte aqui para entrar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors duration-200 cursor-pointer mt-1"
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
      subtitle="Comece grátis, sem cartão de crédito"
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
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                className="sr-only"
                checked={agreedToTerms}
                onChange={(e) => {
                  setAgreedToTerms(e.target.checked);
                  if (e.target.checked) setTermsError(false);
                }}
              />
              <div
                className="w-4.5 h-4.5 w-[18px] h-[18px] rounded-[5px] flex items-center justify-center transition-all duration-200"
                style={{
                  background: agreedToTerms
                    ? "linear-gradient(135deg, #1d4ed8, #2563eb)"
                    : "rgba(255,255,255,0.05)",
                  border: agreedToTerms
                    ? "1px solid transparent"
                    : termsError
                    ? "1px solid rgba(244,63,94,0.6)"
                    : "1px solid rgba(255,255,255,0.15)",
                  boxShadow: agreedToTerms ? "0 2px 8px rgba(37,99,235,0.4)" : undefined,
                }}
              >
                {agreedToTerms && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-slate-400 leading-snug">
              Concordo com os{" "}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); router.push("/termos"); }}
                className="text-brand-400 hover:text-brand-300 font-medium transition-colors duration-200 underline-offset-2 hover:underline"
              >
                Termos de uso
              </button>{" "}
              e a{" "}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); router.push("/privacidade"); }}
                className="text-brand-400 hover:text-brand-300 font-medium transition-colors duration-200 underline-offset-2 hover:underline"
              >
                Política de privacidade
              </button>
            </span>
          </label>
          {termsError && (
            <p className="text-xs text-rose-400 pl-7">
              Você precisa aceitar os termos para continuar.
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 text-center -mb-1">{error}</p>
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
        <p className="text-center text-sm text-slate-500 mt-1">
          Já possui uma conta?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-brand-400 hover:text-brand-300 font-medium transition-colors duration-200 cursor-pointer"
          >
            Entrar
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
