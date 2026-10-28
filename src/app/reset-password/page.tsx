"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordField from "@/components/auth/PasswordField";
import PrimaryButton from "@/components/auth/PrimaryButton";
import PageLoader from "@/components/ui/PageLoader";
import { MIN_PASSWORD, authErrorPt, readAuthLinkError } from "@/lib/authMessages";
import { senhaVazada, MSG_SENHA_VAZADA } from "@/lib/senhaVazada";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError]       = useState("");
  /* Link expirado ou já usado: antes a tela mandava para o login sem explicar */
  const [linkError, setLinkError] = useState("");

  useEffect(() => {
    const fromUrl = readAuthLinkError();
    if (fromUrl) { setLinkError(fromUrl); setChecking(false); return; }

    const code = new URLSearchParams(window.location.search).get("code");

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error: exchErr }) => {
        if (exchErr) { setLinkError(authErrorPt(exchErr.message)); setChecking(false); return; }
        // Limpa o code da URL sem recarregar a página
        window.history.replaceState({}, "", "/reset-password");
        setChecking(false);
      });
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }
      setChecking(false);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) { setError(`A senha deve ter pelo menos ${MIN_PASSWORD} caracteres.`); return; }
    if (password !== confirm) { setError("As senhas não coincidem."); return; }

    setLoading(true);
    setError("");

    if (await senhaVazada(password)) { setError(MSG_SENHA_VAZADA); setLoading(false); return; }

    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(authErrorPt(err.message)); setLoading(false); return; }

    router.replace("/select-workspace");
  }

  if (checking) return <PageLoader />;

  if (linkError) {
    return (
      <AuthLayout title="Link inválido" subtitle={linkError}>
        <PrimaryButton type="button" onClick={() => router.replace("/forgot-password")}>
          Pedir um novo link
        </PrimaryButton>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Nova senha" subtitle="Escolha uma senha segura para sua conta">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <PasswordField
          label="Nova senha"
          id="password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <PasswordField
          label="Confirmar senha"
          id="confirm"
          placeholder="Repita a senha"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        {error && <p role="alert" className="text-sm font-bold text-zero text-center">{error}</p>}

        <PrimaryButton type="submit" loading={loading} disabled={!password || !confirm}>
          Salvar nova senha
        </PrimaryButton>
      </form>
    </AuthLayout>
  );
}
