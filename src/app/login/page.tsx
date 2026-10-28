"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import InputField from "@/components/auth/InputField";
import PasswordField from "@/components/auth/PasswordField";
import PrimaryButton from "@/components/auth/PrimaryButton";
import SocialButton from "@/components/auth/SocialButton";
import Divider from "@/components/auth/Divider";
import PageLoader from "@/components/ui/PageLoader";
import Captcha, { captchaLigado, MSG_CAPTCHA } from "@/components/auth/Captcha";
import { CheckIcon } from "@/components/ui/icons";
import { markSessionActive, lembrarEscolha } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { acordarApi } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [values, setValues]   = useState({ email: "", password: "" });
  /* Desmarcado em aparelho compartilhado: a sessão acaba ao fechar o navegador ou em 2 h (lib/session.ts) */
  const [manter, setManter]   = useState(true);
  /* Quem já está conectado vai direto para a escolha de workspace, sem ver o formulário piscar */
  const [verificando, setVerificando] = useState(true);
  /* CAPTCHA (EQZ-65): o token vale uma tentativa; trocar `captchaVez` gera outro */
  const [captcha, setCaptcha]       = useState<string | null>(null);
  const [captchaVez, setCaptchaVez] = useState(0);

  useEffect(() => {
    acordarApi();
    /* O /auth/callback manda para cá quando o link do e-mail expirou ou já foi usado */
    if (new URLSearchParams(window.location.search).get("link") === "expirado") {
      setError("Este link expirou ou já foi usado. Entre com sua senha ou peça um novo link.");
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/select-workspace");
      else setVerificando(false);
    });
  }, [router]);

  function handleChange(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (captchaLigado && !captcha) { setError(MSG_CAPTCHA); return; }
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email:    values.email,
      password: values.password,
      ...(captcha ? { options: { captchaToken: captcha } } : {}),
    });

    setLoading(false);
    setCaptcha(null);
    setCaptchaVez((v) => v + 1);
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
    markSessionActive(manter);
    router.push("/select-workspace");
  }

  if (verificando) return <PageLoader />;

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
              className="min-h-[32px] text-[13px] text-accent hover:brightness-110 font-extrabold cursor-pointer"
            >
              Esqueceu?
            </button>
          }
        />

        {/* Manter conectado (padrão). Mesmo visual do aceite dos termos no cadastro */}
        <label className="flex items-start gap-3 cursor-pointer">
          <span className="relative shrink-0">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={manter}
              onChange={(e) => setManter(e.target.checked)}
            />
            <span
              aria-hidden="true"
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface ${
                manter ? "bg-accent text-ink" : "bg-ink ring-1 ring-white/15"
              }`}
            >
              {manter && <CheckIcon className="w-4 h-4" strokeWidth={3} />}
            </span>
          </span>
          <span className="text-sm font-semibold text-fg-muted leading-snug pt-0.5">
            Manter conectado neste aparelho
            <span className="block text-xs font-semibold text-fg-subtle mt-0.5">
              Desmarque em computador compartilhado: aí a sessão acaba ao fechar o navegador.
            </span>
          </span>
        </label>

        <Captcha key={captchaVez} onToken={setCaptcha} />

        {/* Error */}
        {error && (
          <p role="alert" className="text-sm font-bold text-zero text-center">{error}</p>
        )}

        {/* Submit */}
        <PrimaryButton type="submit" loading={loading} className="mt-1">
          Entrar
        </PrimaryButton>

        <Divider />

        {/* Google */}
        <SocialButton onClick={async () => {
          /* O /auth/callback lê a escolha ao voltar do Google */
          lembrarEscolha(manter);
          await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
          });
        }}>
          Continuar com Google
        </SocialButton>

        {/* Footer link */}
        <p className="text-center text-sm font-bold text-fg-muted mt-1">
          Não possui uma conta?{" "}
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="text-accent hover:brightness-110 font-extrabold cursor-pointer"
          >
            Criar conta
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
