"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/workspace/TopBar";
import WorkspaceCard from "@/components/workspace/WorkspaceCard";
import LayoutContainer from "@/components/workspace/LayoutContainer";
import SecondaryButton from "@/components/workspace/SecondaryButton";
import PrimaryButton from "@/components/auth/PrimaryButton";
import PageLoader from "@/components/ui/PageLoader";
import { supabase } from "@/lib/supabase";
import { setWorkspace, type WorkspaceRole } from "@/hooks/useWorkspace";

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const BuildingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface WsRow {
  role: string;
  workspaces: { id: string; name: string; description: string | null } | null;
}

interface PendingRow {
  id: string;          // workspace_members.id
  role: string;
  workspaces: { id: string; name: string; description: string | null } | null;
}

export default function SelectWorkspacePage() {
  const router = useRouter();
  const [workspaces, setWorkspaces]   = useState<WsRow[]>([]);
  const [pending, setPending]         = useState<PendingRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [accepting, setAccepting]     = useState<string | null>(null);

  async function load() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) { router.replace("/login"); return; }

    const userId = sessionData.session.user.id;

    const [activeRes, pendingRes] = await Promise.all([
      supabase
        .from("workspace_members")
        .select("role, workspaces(id, name, description)")
        .eq("user_id", userId)
        .eq("status", "ativo"),
      supabase
        .from("workspace_members")
        .select("id, role, workspaces(id, name, description)")
        .eq("user_id", userId)
        .eq("status", "pendente"),
    ]);

    if (activeRes.data)  setWorkspaces(activeRes.data as unknown as WsRow[]);
    if (pendingRes.data) setPending(pendingRes.data as unknown as PendingRow[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [router]);

  async function handleAccept(row: PendingRow) {
    if (!row.workspaces) return;
    setAccepting(row.id);
    await supabase
      .from("workspace_members")
      .update({ status: "ativo" })
      .eq("id", row.id);
    await load();
    setAccepting(null);
  }

  async function handleDecline(row: PendingRow) {
    setAccepting(row.id);
    await supabase
      .from("workspace_members")
      .delete()
      .eq("id", row.id);
    setPending((p) => p.filter((r) => r.id !== row.id));
    setAccepting(null);
  }

  function handleContinue() {
    if (!selectedId) return;
    const ws = workspaces.find((w) => w.workspaces?.id === selectedId);
    if (!ws?.workspaces) return;
    setSaving(true);
    setWorkspace({ id: ws.workspaces.id, name: ws.workspaces.name, role: ws.role as WorkspaceRole });
    router.push("/dashboard");
  }

  const selectedName = workspaces.find((w) => w.workspaces?.id === selectedId)?.workspaces?.name;

  return (
    <div className="min-h-screen bg-navy-900 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "700px", height: "400px",
          background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.15) 0%, transparent 70%)",
        }}
      />

      <TopBar />

      <main className="pt-14 pb-28 md:pb-12 min-h-screen flex flex-col justify-center">
        <LayoutContainer className="py-10">

          <div className="mb-8 text-center">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{ background: "rgba(29,78,216,0.15)", border: "1px solid rgba(59,130,246,0.2)" }}
            >
              <BuildingIcon />
            </div>
            <h1 className="font-display font-bold text-2xl text-white">Selecionar workspace</h1>
            <p className="text-slate-400 text-sm mt-1.5">Escolha em qual empresa você deseja trabalhar agora</p>
          </div>

          {loading ? <PageLoader /> : (
            <div className="flex flex-col gap-8">

              {/* ── Convites pendentes ── */}
              {pending.length > 0 && (
                <div>
                  <p className="text-[10px] text-amber-400 uppercase tracking-widest font-semibold mb-3">
                    Convites pendentes
                  </p>
                  <div className="flex flex-col gap-2">
                    {pending.map((row) => {
                      if (!row.workspaces) return null;
                      const busy = accepting === row.id;
                      return (
                        <div
                          key={row.id}
                          className="rounded-xl px-4 py-3.5 flex items-center justify-between gap-3"
                          style={{
                            background: "rgba(217,119,6,0.07)",
                            border: "1px solid rgba(245,158,11,0.2)",
                          }}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{row.workspaces.name}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 capitalize">{row.role}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleDecline(row)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 disabled:opacity-40"
                              style={{ background: "rgba(255,255,255,0.05)", color: "#64748B", border: "1px solid rgba(255,255,255,0.08)" }}
                            >
                              <XIcon /> Recusar
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleAccept(row)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 disabled:opacity-40"
                              style={{ background: "rgba(5,150,105,0.15)", color: "#6EE7B7", border: "1px solid rgba(16,185,129,0.25)" }}
                            >
                              <CheckIcon /> {busy ? "…" : "Aceitar"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Workspaces ativos ── */}
              {workspaces.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-6">Nenhum workspace encontrado.</p>
              ) : (
                <div>
                  {pending.length > 0 && (
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mb-3">
                      Seus workspaces
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {workspaces.map((w) => {
                      if (!w.workspaces) return null;
                      const role = w.role as "owner" | "admin" | "member";
                      return (
                        <WorkspaceCard
                          key={w.workspaces.id}
                          name={w.workspaces.name}
                          role={role}
                          description={w.workspaces.description ?? ""}
                          selected={selectedId === w.workspaces.id}
                          onSelect={() => setSelectedId((p) => p === w.workspaces!.id ? null : w.workspaces!.id)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          <div className="h-5 mt-3">
            {selectedName && (
              <p className="text-xs text-center text-slate-600">
                <span className="text-emerald-500 font-medium">{selectedName}</span> selecionado
              </p>
            )}
          </div>

          <div className="hidden md:flex flex-row gap-3 mt-6 justify-center">
            <div className="w-44">
              <PrimaryButton onClick={handleContinue} loading={saving} disabled={!selectedId}>
                {!saving && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
                Continuar
              </PrimaryButton>
            </div>
            <div className="w-52">
              <SecondaryButton onClick={() => router.push("/register-company")} icon={<PlusIcon />}>
                Criar nova empresa
              </SecondaryButton>
            </div>
          </div>

        </LayoutContainer>
      </main>

      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-4"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(15,23,42,0.98) 40%)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <div className="flex flex-col gap-2.5 max-w-lg mx-auto">
          <PrimaryButton onClick={handleContinue} loading={saving} disabled={!selectedId}>
            {!saving && (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
            Continuar
          </PrimaryButton>
          <SecondaryButton onClick={() => router.push("/register-company")} icon={<PlusIcon />}>
            Criar nova empresa
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
