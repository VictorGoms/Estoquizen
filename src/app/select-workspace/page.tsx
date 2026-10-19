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
import { api } from "@/lib/api";
import { setWorkspace, type WorkspaceRole } from "@/hooks/useWorkspace";
import { ArrowRightIcon } from "@/components/ui/icons";

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const BuildingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
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
  const [checkoutStatus, setCheckoutStatus] = useState<"success" | "canceled" | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("checkout");
    if (status === "success" || status === "canceled") {
      setCheckoutStatus(status);
      /* Remove o parâmetro da URL sem recarregar */
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

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
    /* Pela API, que só muda o status (direto no banco dava para trocar o papel junto) */
    await api.post("/members/accept", { workspace_id: row.workspaces.id }).catch(() => null);
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

  const ROLE_PT: Record<string, string> = { owner: "Proprietário", admin: "Administrador", member: "Membro" };

  return (
    <div className="min-h-screen bg-ink">
      <TopBar />

      <main className="pt-16 pb-48 md:pb-12 min-h-screen flex flex-col justify-center">
        <LayoutContainer className="py-10 flex flex-col gap-7">

          {checkoutStatus === "success" && (
            <p role="status" className="px-4 py-3 rounded-3xl text-sm font-extrabold text-center bg-ok/15 text-ok">
              Pagamento confirmado! Selecione seu workspace para continuar.
            </p>
          )}
          {checkoutStatus === "canceled" && (
            <p role="status" className="px-4 py-3 rounded-3xl text-sm font-extrabold text-center bg-zero/15 text-zero">
              Pagamento cancelado. Você pode tentar novamente nas configurações.
            </p>
          )}

          <div className="text-center flex flex-col items-center gap-2">
            <span className="w-16 h-16 rounded-full bg-surface text-accent flex items-center justify-center mb-2">
              <BuildingIcon />
            </span>
            <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight">Selecionar workspace</h1>
            <p className="text-[15px] font-bold text-fg-muted">Escolha em qual empresa você quer trabalhar agora</p>
          </div>

          {loading ? <PageLoader /> : (
            <div className="flex flex-col gap-8">

              {/* ── Convites pendentes ── */}
              {pending.length > 0 && (
                <section className="flex flex-col gap-3">
                  <h2 className="text-sm font-extrabold text-low">Convites pendentes</h2>
                  <div className="flex flex-col gap-2.5">
                    {pending.map((row) => {
                      if (!row.workspaces) return null;
                      const busy = accepting === row.id;
                      return (
                        <div key={row.id} className="rounded-4xl bg-surface ring-1 ring-low/25 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[15px] font-black truncate">{row.workspaces.name}</p>
                            <p className="text-[13px] font-bold text-fg-muted">Convite como {ROLE_PT[row.role] ?? row.role}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleDecline(row)}
                              className="flex items-center gap-1.5 min-h-[44px] px-4 rounded-full bg-surface-2 text-sm font-extrabold cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-40"
                            >
                              <XIcon /> Recusar
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleAccept(row)}
                              className="flex items-center gap-1.5 min-h-[44px] px-4 rounded-full bg-accent text-ink text-sm font-black cursor-pointer hover:brightness-110 transition-[filter] disabled:opacity-40"
                            >
                              <CheckIcon /> {busy ? "…" : "Aceitar"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── Workspaces ativos ── */}
              {workspaces.length === 0 ? (
                <p className="text-center text-[15px] font-bold text-fg-muted py-6">Nenhum workspace encontrado. Crie sua empresa para começar.</p>
              ) : (
                <section className="flex flex-col gap-3">
                  {pending.length > 0 && <h2 className="text-sm font-extrabold text-fg-muted">Seus workspaces</h2>}
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
                </section>
              )}
            </div>
          )}

          <p aria-live="polite" className="h-5 text-sm font-bold text-center text-fg-muted">
            {selectedName && <><span className="text-fg font-black">{selectedName}</span> selecionado</>}
          </p>

          <div className="hidden md:flex flex-row gap-3 justify-center">
            <div className="w-48">
              <PrimaryButton onClick={handleContinue} loading={saving} disabled={!selectedId}>
                Continuar <ArrowRightIcon className="w-5 h-5" strokeWidth={2.4} />
              </PrimaryButton>
            </div>
            <div className="w-56">
              <SecondaryButton onClick={() => router.push("/register-company")} icon={<PlusIcon />}>
                Criar nova empresa
              </SecondaryButton>
            </div>
          </div>
        </LayoutContainer>
      </main>

      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 px-4 pt-4 pb-[calc(20px+env(safe-area-inset-bottom))] bg-ink/95 backdrop-blur-sm border-t border-white/6">
        <div className="flex flex-col gap-2.5 max-w-lg mx-auto">
          <PrimaryButton onClick={handleContinue} loading={saving} disabled={!selectedId}>
            Continuar <ArrowRightIcon className="w-5 h-5" strokeWidth={2.4} />
          </PrimaryButton>
          <SecondaryButton onClick={() => router.push("/register-company")} icon={<PlusIcon />}>
            Criar nova empresa
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
