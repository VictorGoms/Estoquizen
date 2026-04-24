"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import InputField from "@/components/auth/InputField";
import PasswordField from "@/components/auth/PasswordField";
import PrimaryButton from "@/components/auth/PrimaryButton";
import SocialButton from "@/components/auth/SocialButton";
import Divider from "@/components/auth/Divider";
import { markSessionActive } from "@/lib/session";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [values, setValues]   = useState({ email: "", password: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/select-workspace");
    });
  }, [router]);

  function handleChange(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email:    values.email,
      password: values.password,
    });

    setLoading(false);
    if (authError) {
      const msg = authError.message.toLowerCase();
      if (msg.includes("invalid login") || msg.includes("invalid credentials") || msg.includes("wrong password")) {
        setError("Email ou senha incorretos.");
      } else if (msg.includes("email not confirmed")) {
        setError("Email não confirmado. Verifique sua caixa de entrada.");
      } else {
        setError("Não foi possível entrar. Tente novamente.");
      }
      return;
    }
    markSessionActive();
    router.push("/select-workspace");
  }

  return (
    <AuthLayout
      title="Bem-vindo de volta"
      subtitle="Entre na sua conta para continuar"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
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
          placeholder="••••••••"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange("password")}
          required
          rightSlot={
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors duration-200 cursor-pointer"
            >
              Esqueceu?
            </button>
          }
        />

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 text-center -mb-1">{error}</p>
        )}

        {/* Submit */}
        <PrimaryButton type="submit" loading={loading} className="mt-1">
          Entrar
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
          Não possui uma conta?{" "}
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="text-brand-400 hover:text-brand-300 font-medium transition-colors duration-200 cursor-pointer"
          >
            Solicitar acesso
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
