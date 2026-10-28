"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PrimaryButton from "@/components/auth/PrimaryButton";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordField from "@/components/auth/PasswordField";
import { UsersIcon, ArrowRightIcon } from "@/components/ui/icons";
import PageLoader from "@/components/ui/PageLoader";
import { MIN_PASSWORD, authErrorPt } from "@/lib/authMessages";
import { workspaceDoLink } from "@/lib/convite";
import { senhaVazada, MSG_SENHA_VAZADA } from "@/lib/senhaVazada";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword]         = useState("");
  const [confirm, setConfirm]           = useState("");
  const [loading, setLoading]           = useState(false);
  const [checking, setChecking]         = useState(true);
  const [error, setError]               = useState("");
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [conviteWorkspace, setConviteWorkspace] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      // refreshSession inicializa o estado interno do cliente antes de updateUser
      // (evita "auth session missing" após redirect do callback)
      let { data: { session } } = await supabase.auth.refreshSession();
      if (!session) ({ data: { session } } = await supabase.auth.getSession());

      if (!session?.user?.user_metadata?.from_invite) {
        router.replace("/select-workspace");
        return;
      }

      /* O workspace vem do link do convite (EQZ-56). Sem ele (a pessoa chegou sem clicar no e-mail),
         vale o do metadata, e o nome dele aparece na tela antes de aceitar */
      const wsId  = workspaceDoLink(window.location.search) ?? (session.user.user_metadata.workspace_id as string | undefined) ?? null;
      setConviteWorkspace(wsId);
      const userId = session.user.id;

      // Verifica se o convite ainda existe (pode ter sido revogado)
      if (wsId && userId) {
        const { data: membership } = await supabase
          .from("workspace_members")
          .select("id")
          .eq("workspace_id", wsId)
          .eq("user_id", userId)
          .eq("status", "pendente")
          .maybeSingle();

        if (!membership) {
          router.replace("/convite-invalido");
          return;
        }

        const { data: ws } = await supabase
          .from("workspaces")
          .select("name")
          .eq("id", wsId)
          .single();
        if (ws) setWorkspaceName(ws.name);
      }

      setChecking(false);
    }
    init();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) { setError(`A senha deve ter pelo menos ${MIN_PASSWORD} caracteres.`); return; }
    if (password !== confirm) { setError("As senhas não coincidem."); return; }

    setLoading(true);
    setError("");

    try {
      if (await senhaVazada(password)) throw new Error(MSG_SENHA_VAZADA);
      const { error: pwErr } = await supabase.auth.updateUser({ password });
      if (pwErr) throw new Error(authErrorPt(pwErr.message));

      if (!conviteWorkspace) throw new Error("Não achamos o convite. Abra de novo o link do e-mail de convite.");
      const { error: rpcErr } = await supabase.rpc("accept_workspace_invite", { p_workspace_id: conviteWorkspace });
      if (rpcErr) throw new Error(rpcErr.message);

      router.replace("/select-workspace");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao definir senha");
      setLoading(false);
    }
  }

  if (checking) return <PageLoader />;

  return (
    <AuthLayout
      title="Você foi convidado!"
      icon={<UsersIcon className="w-7 h-7" />}
      subtitle={workspaceName
        ? <>Defina uma senha para acessar o workspace <span className="text-accent font-extrabold">{workspaceName}</span>.</>
        : "Defina uma senha para continuar."}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <PasswordField
          label="Nova senha"
          id="password"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordField
          label="Confirmar senha"
          id="confirm"
          placeholder="Repita a senha"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <p role="alert" className="text-sm font-bold text-zero text-center">{error}</p>}
        <PrimaryButton type="submit" loading={loading} disabled={!password || !confirm}>
          Confirmar e entrar <ArrowRightIcon className="w-5 h-5" strokeWidth={2.4} />
        </PrimaryButton>
      </form>
    </AuthLayout>
  );
}
