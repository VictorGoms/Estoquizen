"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordField from "@/components/auth/PasswordField";
import PrimaryButton from "@/components/auth/PrimaryButton";
import PageLoader from "@/components/ui/PageLoader";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error: exchErr }) => {
        if (exchErr) { router.replace("/login"); return; }
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
    if (password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    if (password !== confirm) { setError("As senhas não coincidem."); return; }

    setLoading(true);
    setError("");

    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError("Não foi possível redefinir a senha. Tente novamente."); setLoading(false); return; }

    router.replace("/select-workspace");
  }

  if (checking) return <PageLoader />;

  return (
    <AuthLayout title="Nova senha" subtitle="Escolha uma senha segura para sua conta">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <PasswordField
          label="Nova senha"
          id="password"
          placeholder="Mínimo 6 caracteres"
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
