"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { markSessionActive } from "@/lib/session";
import AuthLayout from "@/components/auth/AuthLayout";
import PrimaryButton from "@/components/auth/PrimaryButton";
import { UsersIcon } from "@/components/ui/icons";
import PageLoader from "@/components/ui/PageLoader";

function AceitarConviteInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const workspaceId  = searchParams.get("workspace_id");

  const [loading,       setLoading]       = useState(false);
  const [checking,      setChecking]      = useState(true);
  const [error,         setError]         = useState("");
  const [workspaceName, setWorkspaceName] = useState("");

  useEffect(() => {
    async function init() {
      const code = new URLSearchParams(window.location.search).get("code");

      if (code) {
        const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exchErr) { router.replace("/login"); return; }
        window.history.replaceState(
          {},
          "",
          workspaceId ? `/aceitar-convite?workspace_id=${workspaceId}` : "/aceitar-convite",
        );
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      if (!workspaceId) { router.replace("/select-workspace"); return; }

      const { data: ws } = await supabase
        .from("workspaces")
        .select("name")
        .eq("id", workspaceId)
        .single();

      if (!ws) { router.replace("/convite-invalido"); return; }
      setWorkspaceName(ws.name);
      setChecking(false);
    }

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAccept() {
    setLoading(true);
    setError("");
    try {
      await api.post("/members/accept", { workspace_id: workspaceId });
      markSessionActive();
      router.replace("/select-workspace");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao aceitar convite");
      setLoading(false);
    }
  }

  if (checking) return <PageLoader />;

  return (
    <AuthLayout
      title="Você foi convidado!"
      icon={<UsersIcon className="w-7 h-7" />}
      subtitle={<>Você foi convidado para colaborar no workspace <span className="text-accent font-extrabold">{workspaceName}</span>.</>}
    >
      <div className="flex flex-col gap-3">
        {error && <p role="alert" className="text-sm font-bold text-zero text-center mb-1">{error}</p>}
        <PrimaryButton onClick={handleAccept} loading={loading}>
          Aceitar convite
        </PrimaryButton>
        <button
          type="button"
          onClick={() => router.replace("/select-workspace")}
          className="w-full min-h-[48px] rounded-full text-[15px] font-extrabold text-fg-muted hover:text-fg hover:bg-white/5 transition-colors cursor-pointer"
        >
          Agora não
        </button>
      </div>
    </AuthLayout>
  );
}

export default function AceitarConvitePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AceitarConviteInner />
    </Suspense>
  );
}
