"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import PageLoader from "@/components/ui/PageLoader";
import PageError from "@/components/ui/PageError";
import { supabase } from "@/lib/supabase";
import { getWorkspace } from "@/hooks/useWorkspace";
import { useRole, can } from "@/hooks/useRole";
import AccessDenied from "@/components/ui/AccessDenied";

/* ─── Icons ─── */
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

type Role   = "owner" | "admin" | "member";
type Status = "ativo" | "pendente" | "inativo";

interface MemberData {
  memberId:    string;   // workspace_members.id
  userId:      string;   // profiles.id
  name:        string;
  email:       string;
  avatarColor: string;
  avatarUrl:   string | null;
  initials:    string;
  joinedAt:    string;
  role:        Role;
  status:      Status;
}

const ROLE_CONFIG: Record<Role, { label: string; bg: string; text: string; border: string; desc: string }> = {
  owner:  { label: "Owner",         bg: "rgba(217,119,6,0.12)",  text: "#FCD34D", border: "rgba(245,158,11,0.35)", desc: "Acesso total — gerencia membros, planos e configurações" },
  admin:  { label: "Administrador", bg: "rgba(37,99,235,0.12)",  text: "#93C5FD", border: "rgba(59,130,246,0.3)",  desc: "Gerencia estoque, notas fiscais, relatórios e membros" },
  member: { label: "Membro",        bg: "rgba(5,150,105,0.12)",  text: "#6EE7B7", border: "rgba(16,185,129,0.3)",  desc: "Acesso operacional — visualiza e movimenta itens do estoque" },
};

const STATUS_OPTIONS: Array<{ id: Status; label: string; dot: string }> = [
  { id: "ativo",    label: "Ativo",    dot: "#10B981" },
  { id: "pendente", label: "Pendente", dot: "#F59E0B" },
  { id: "inativo",  label: "Inativo",  dot: "#475569" },
];

function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

export default function MemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = typeof params.id === "string" ? params.id : "";

  const wsRole = useRole();
  const [member, setMember]   = useState<MemberData | null>(null);
  const [wsName, setWsName]   = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const [role,   setRole]   = useState<Role>("member");
  const [status, setStatus] = useState<Status>("ativo");
  const [originalRole, setOriginalRole]     = useState<Role>("member");
  const [originalStatus, setOriginalStatus] = useState<Status>("ativo");

  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    async function load() {
      const ws = getWorkspace();
      if (!ws) { router.push("/select-workspace"); return; }
      setWsName(ws.name);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
        setUserName(profile?.name ?? user.email?.split("@")[0] ?? "");
      }

      const { data: wmData, error: err } = await supabase
        .from("workspace_members")
        .select("id, role, status, created_at, user_id")
        .eq("id", memberId)
        .eq("workspace_id", ws.id)
        .single();

      if (err || !wmData) {
        setError(err?.message ?? "Membro não encontrado");
        setLoading(false);
        return;
      }

      const wm = wmData as unknown as { id: string; role: string; status: string; created_at: string; user_id: string };

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_color, avatar_url")
        .eq("id", wm.user_id)
        .single();

      const name = prof?.name ?? prof?.email?.split("@")[0] ?? "Sem nome";
      const m: MemberData = {
        memberId:    wm.id,
        userId:      prof?.id ?? wm.user_id,
        name,
        email:       prof?.email ?? "",
        avatarColor: prof?.avatar_color ?? "rgba(37,99,235,0.5)",
        avatarUrl:   prof?.avatar_url ?? null,
        initials:    getInitials(name),
        joinedAt:    new Date(wm.created_at).toLocaleDateString("pt-BR"),
        role:        wm.role as Role,
        status:      wm.status as Status,
      };
      setMember(m);
      setRole(m.role);
      setStatus(m.status);
      setOriginalRole(m.role);
      setOriginalStatus(m.status);
      setLoading(false);
    }
    load();
  }, [router, memberId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!member) return;
    setSaving(true);

    const { error: err } = await supabase
      .from("workspace_members")
      .update({ role, status })
      .eq("id", member.memberId);

    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setOriginalRole(role);
    setOriginalStatus(status);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleRemove() {
    if (!member) return;
    setRemoving(true);
    await supabase.from("workspace_members").delete().eq("id", member.memberId);
    router.push("/membros");
  }

  const isDirty = role !== originalRole || status !== originalStatus;
  const roleCfg = ROLE_CONFIG[role];
  const statusCfg = STATUS_OPTIONS.find((s) => s.id === status)!;

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <PageError message={error || "Membro não encontrado"} onRetry={() => router.push("/membros")} />
      </div>
    );
  }

  if (!can(wsRole, "canEditMembro")) return <AccessDenied />;

  return (
    <div className="min-h-screen bg-navy-900 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "700px", height: "350px",
          background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.09) 0%, transparent 70%)",
        }}
      />

      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      <main className="lg:pl-60 pt-14 pb-28 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 lg:py-8 flex flex-col gap-6">

            {/* Breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/membros")}
                className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs font-medium cursor-pointer transition-colors duration-200"
              >
                <ArrowLeftIcon />
                Membros
              </button>
              <span className="text-slate-700 text-xs">/</span>
              <span className="text-slate-400 text-xs truncate">{member.name}</span>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">

              {/* ── LEFT: avatar + meta ── */}
              <div className="flex flex-col gap-4">

                {/* Avatar card */}
                <div
                  className="rounded-2xl p-6 flex flex-col items-center gap-4"
                  style={{ background: "rgba(22,32,52,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-20 h-20 rounded-2xl object-cover"
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                      style={{ background: member.avatarColor }}
                    >
                      {member.initials}
                    </div>
                  )}
                  <div className="text-center">
                    <p className="font-display font-bold text-base text-white">{member.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <span
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: roleCfg.bg, color: roleCfg.text }}
                    >
                      {roleCfg.label}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusCfg.dot }} />
                      {statusCfg.label}
                    </span>
                  </div>
                </div>

                {/* Meta info */}
                <div
                  className="rounded-2xl p-5 flex flex-col gap-3"
                  style={{ background: "rgba(22,32,52,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {[
                    { label: "Membro desde", value: member.joinedAt },
                    { label: "ID do membro", value: member.memberId.slice(0, 8) + "…" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between py-2"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <span className="text-xs text-slate-500">{row.label}</span>
                      <span className="text-xs font-medium text-slate-300 font-mono">{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Remove button */}
                {!confirm ? (
                  <button
                    type="button"
                    onClick={() => setConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-200"
                    style={{
                      background: "rgba(220,38,38,0.08)",
                      border: "1px solid rgba(239,68,68,0.18)",
                      color: "#FCA5A5",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.16)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.08)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.18)"; }}
                  >
                    <TrashIcon />
                    Remover do workspace
                  </button>
                ) : (
                  <div
                    className="rounded-2xl p-4 flex flex-col gap-3"
                    style={{ background: "rgba(220,38,38,0.10)", border: "1px solid rgba(239,68,68,0.25)" }}
                  >
                    <p className="text-sm text-white font-medium">Remover {member.name}?</p>
                    <p className="text-xs text-slate-500">Esta ação remove o acesso imediatamente.</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirm(false)}
                        className="flex-1 py-2 rounded-xl text-xs font-medium cursor-pointer"
                        style={{ background: "rgba(255,255,255,0.06)", color: "#64748B" }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleRemove}
                        disabled={removing}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-60"
                        style={{ background: "rgba(220,38,38,0.5)", color: "#FCA5A5" }}
                      >
                        {removing ? "Removendo…" : "Confirmar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── RIGHT: edit form ── */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSave} className="flex flex-col gap-5">

                  {/* Role */}
                  <div
                    className="rounded-2xl p-5 flex flex-col gap-4"
                    style={{ background: "rgba(22,32,52,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <h3 className="text-sm font-semibold text-white">Função no workspace</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {(Object.keys(ROLE_CONFIG) as Role[]).map((r) => {
                        const cfg    = ROLE_CONFIG[r];
                        const active = role === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className="text-left p-3.5 rounded-xl cursor-pointer transition-all duration-200"
                            style={{
                              background: active ? cfg.bg : "rgba(15,23,42,0.5)",
                              border: active ? `1px solid ${cfg.border}` : "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold" style={{ color: active ? cfg.text : "#64748B" }}>
                                {cfg.label}
                              </span>
                              {active && (
                                <span
                                  className="w-4 h-4 rounded-full flex items-center justify-center"
                                  style={{ background: cfg.border }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] leading-relaxed" style={{ color: active ? "#475569" : "#1E293B" }}>
                              {cfg.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status */}
                  <div
                    className="rounded-2xl p-5 flex flex-col gap-4"
                    style={{ background: "rgba(22,32,52,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <h3 className="text-sm font-semibold text-white">Status da conta</h3>
                    <div className="flex gap-2.5 flex-wrap">
                      {STATUS_OPTIONS.map((s) => {
                        const active = status === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setStatus(s.id)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200"
                            style={{
                              background: active ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.5)",
                              border: active ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.06)",
                              color: active ? "#F1F5F9" : "#475569",
                            }}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ background: s.dot }} />
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => router.push("/membros")}
                      className="flex-1 sm:flex-none sm:w-32 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200"
                      style={{
                        background: "rgba(30,41,59,0.7)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#64748B",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#F1F5F9"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#64748B"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !isDirty}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
                      style={{
                        background: saved
                          ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                          : "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                        boxShadow: isDirty ? "0 4px 14px rgba(37,99,235,0.35)" : "none",
                        transition: "background 0.3s, box-shadow 0.2s, transform 0.2s",
                      }}
                    >
                      {saving ? (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : saved ? (
                        <CheckIcon />
                      ) : null}
                      {saving ? "Salvando…" : saved ? "Salvo!" : "Salvar alterações"}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
