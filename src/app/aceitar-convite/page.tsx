"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { markSessionActive } from "@/lib/session";
import PrimaryButton from "@/components/auth/PrimaryButton";
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
          className="rounded-2xl p-8 text-center"
          style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(59,130,246,0.25)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>

          <h1 className="font-display font-bold text-xl text-white mb-2">Você foi convidado!</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-7">
            Você foi convidado para colaborar no workspace{" "}
            <span className="text-brand-400 font-semibold">{workspaceName}</span>.
          </p>

          {error && <p className="text-xs text-red-400 text-center mb-4">{error}</p>}

          <PrimaryButton onClick={handleAccept} loading={loading}>
            Aceitar convite
          </PrimaryButton>

          <button
            type="button"
            onClick={() => router.replace("/select-workspace")}
            className="mt-4 text-sm text-slate-500 hover:text-slate-400 transition-colors cursor-pointer block w-full"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AceitarConvitePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AceitarConviteInner />
    </Suspense>
  );
}
