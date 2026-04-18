"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PrimaryButton from "@/components/auth/PrimaryButton";
import InputField from "@/components/auth/InputField";
import PageLoader from "@/components/ui/PageLoader";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword]         = useState("");
  const [confirm, setConfirm]           = useState("");
  const [loading, setLoading]           = useState(false);
  const [checking, setChecking]         = useState(true);
  const [error, setError]               = useState("");
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.user_metadata?.from_invite) {
        router.replace("/select-workspace");
        return;
      }

      // Busca nome do workspace para exibir na tela
      const wsId = session.user.user_metadata.workspace_id as string;
      if (wsId) {
        const { data } = await supabase
          .from("workspaces")
          .select("name")
          .eq("id", wsId)
          .single();
        if (data) setWorkspaceName(data.name);
      }

      setChecking(false);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    if (password !== confirm) { setError("As senhas não coincidem."); return; }

    setLoading(true);
    setError("");

    try {
      const { error: pwErr } = await supabase.auth.updateUser({ password });
      if (pwErr) throw new Error(pwErr.message);

      const { error: rpcErr } = await supabase.rpc("accept_workspace_invite");
      if (rpcErr) throw new Error(rpcErr.message);

      router.replace("/select-workspace");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao definir senha");
      setLoading(false);
    }
  }

  if (checking) return <PageLoader />;

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "600px", height: "350px",
          background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="font-display font-bold text-white text-lg">Estoquizen</span>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="mb-6 text-center">
            <h1 className="font-display font-bold text-xl text-white">Você foi convidado!</h1>
            {workspaceName && (
              <p className="text-slate-400 text-sm mt-2">
                Defina uma senha para acessar o workspace{" "}
                <span className="text-brand-400 font-semibold">{workspaceName}</span>.
              </p>
            )}
            {!workspaceName && (
              <p className="text-slate-400 text-sm mt-2">Defina uma senha para continuar.</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <InputField
              label="Nova senha"
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <InputField
              label="Confirmar senha"
              id="confirm"
              type="password"
              placeholder="Repita a senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />

            {error && <p className="text-xs text-red-400 text-center">{error}</p>}

            <div className="pt-1">
              <PrimaryButton type="submit" loading={loading} disabled={!password || !confirm}>
                {!loading && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
                Confirmar e entrar
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
