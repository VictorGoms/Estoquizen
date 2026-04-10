"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import PageLoader from "@/components/ui/PageLoader";
import PageError from "@/components/ui/PageError";
import { supabase } from "@/lib/supabase";
import { getWorkspace } from "@/hooks/useWorkspace";

/* ─── Icons ─── */
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);
const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

type Role   = "owner" | "admin" | "member";
type Status = "ativo" | "pendente" | "inativo";

interface Member {
  id: string;        // workspace_members.id
  name: string;
  email: string;
  role: Role;
  status: Status;
  initials: string;
  avatarColor: string;
  avatarUrl: string | null;
}

interface MemberRow {
  id: string;
  role: string;
  status: string;
  user_id: string;
}

const ROLE_CONFIG: Record<Role, { label: string; bg: string; text: string }> = {
  owner:  { label: "Owner",         bg: "rgba(217,119,6,0.18)",  text: "#FCD34D" },
  admin:  { label: "Administrador", bg: "rgba(37,99,235,0.18)",  text: "#93C5FD" },
  member: { label: "Membro",        bg: "rgba(5,150,105,0.18)",  text: "#6EE7B7" },
};

const STATUS_CONFIG: Record<Status, { label: string; dot: string }> = {
  ativo:    { label: "Ativo",    dot: "#10B981" },
  pendente: { label: "Pendente", dot: "#F59E0B" },
  inativo:  { label: "Inativo",  dot: "#475569" },
};

const ROLE_FILTERS = [
  { id: "todos",  label: "Todos" },
  { id: "owner",  label: "Owners" },
  { id: "admin",  label: "Admins" },
  { id: "member", label: "Membros" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function MembrosPage() {
  const router = useRouter();
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [members, setMembers]       = useState<Member[]>([]);
  const [wsName, setWsName]         = useState("");
  const [userName, setUserName]     = useState("");
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  useEffect(() => {
    async function load() {
      const ws = getWorkspace();
      if (!ws) { router.push("/select-workspace"); return; }
      setWsName(ws.name);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .single();
        setUserName(profile?.name ?? user.email?.split("@")[0] ?? "");
      }

      const { data: memberRows, error: err } = await supabase
        .from("workspace_members")
        .select("id, role, status, user_id")
        .eq("workspace_id", ws.id)
        .order("created_at");

      if (err) { setError(err.message); setLoading(false); return; }

      const userIds = (memberRows ?? []).map((r: { user_id: string }) => r.user_id);
      const { data: profileRows } = userIds.length > 0
        ? await supabase.from("profiles").select("id, name, email, avatar_color, avatar_url").in("id", userIds)
        : { data: [] };

      const profileMap = new Map((profileRows ?? []).map((p: { id: string; name: string | null; email: string | null; avatar_color: string | null; avatar_url: string | null }) => [p.id, p]));

      setMembers(
        ((memberRows ?? []) as unknown as MemberRow[]).map((row) => {
          const prof = profileMap.get(row.user_id);
          const name = prof?.name ?? prof?.email?.split("@")[0] ?? "Sem nome";
          return {
            id:          row.id,
            name,
            email:       prof?.email ?? "",
            role:        row.role as Role,
            status:      row.status as Status,
            initials:    getInitials(name),
            avatarColor: prof?.avatar_color ?? "rgba(37,99,235,0.5)",
            avatarUrl:   prof?.avatar_url ?? null,
          };
        })
      );
      setLoading(false);
    }
    load();
  }, [router]);

  const filtered = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "todos" || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalAtivos    = members.filter((m) => m.status === "ativo").length;
  const totalAdmins    = members.filter((m) => m.role === "owner" || m.role === "admin").length;
  const totalPendentes = members.filter((m) => m.status === "pendente").length;

  return (
    <div className="min-h-screen bg-navy-900 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "800px",
          height: "400px",
          background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.10) 0%, transparent 70%)",
        }}
      />

      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      <main className="lg:pl-60 pt-14 pb-28 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 lg:py-8">

            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="font-display font-bold text-xl text-white">Membros</h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  {loading ? "Carregando…" : `${members.length} pessoa${members.length !== 1 ? "s" : ""} no workspace`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/membros/novo")}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                  boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
                }}
              >
                <PlusIcon />
                Adicionar membro
              </button>
            </div>

            {loading ? (
              <PageLoader />
            ) : error ? (
              <PageError message={error} onRetry={() => { setError(""); setLoading(true); }} />
            ) : (
              <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">

                {/* ── LEFT: list ── */}
                <div className="lg:col-span-2 flex flex-col gap-5">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                        <SearchIcon />
                      </span>
                      <input
                        type="text"
                        placeholder="Buscar por nome ou e-mail..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
                        style={{
                          background: "rgba(30,41,59,0.7)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                        onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                      />
                    </div>
                    <div className="flex gap-2 overflow-x-auto scrollbar-none">
                      {ROLE_FILTERS.map((f) => {
                        const active = roleFilter === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setRoleFilter(f.id)}
                            className="flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200"
                            style={{
                              background: active ? "rgba(37,99,235,0.2)" : "rgba(30,41,59,0.7)",
                              border: active ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
                              color: active ? "#93C5FD" : "#64748B",
                            }}
                          >
                            {f.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {filtered.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {filtered.map((member) => {
                        const role = ROLE_CONFIG[member.role];
                        const st   = STATUS_CONFIG[member.status];
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => router.push(`/membros/${member.id}`)}
                            className="group w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                            style={{
                              background: "rgba(22,32,52,0.8)",
                              border: "1px solid rgba(255,255,255,0.08)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)";
                              e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.3)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            {member.avatarUrl ? (
                              <img
                                src={member.avatarUrl}
                                alt={member.name}
                                className="flex-shrink-0 w-10 h-10 rounded-xl object-cover"
                              />
                            ) : (
                              <div
                                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                                style={{ background: member.avatarColor }}
                              >
                                {member.initials}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors duration-200 truncate">
                                  {member.name}
                                </span>
                                <span
                                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                  style={{ background: st.dot }}
                                  title={st.label}
                                />
                              </div>
                              <p className="text-xs text-slate-600 truncate mt-0.5">{member.email}</p>
                            </div>

                            <div className="hidden sm:flex flex-col items-end gap-1.5 flex-shrink-0">
                              <span
                                className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                                style={{ background: role.bg, color: role.text }}
                              >
                                {role.label}
                              </span>
                            </div>

                            <span
                              className="sm:hidden flex-shrink-0 text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                              style={{ background: role.bg, color: role.text }}
                            >
                              {role.label}
                            </span>

                            <span className="text-slate-700 group-hover:text-brand-400 transition-colors duration-200 hidden sm:block">
                              <ChevronRightIcon />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-600"
                        style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        <UsersIcon />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-medium text-sm">Nenhum membro encontrado</p>
                        <p className="text-slate-600 text-xs mt-1">Tente outro termo ou filtro</p>
                      </div>
                      {(search || roleFilter !== "todos") && (
                        <button
                          type="button"
                          onClick={() => { setSearch(""); setRoleFilter("todos"); }}
                          className="text-xs text-brand-400 hover:text-brand-300 cursor-pointer transition-colors duration-200"
                        >
                          Limpar filtros
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* ── RIGHT: info panel (desktop only) ── */}
                <div className="hidden lg:flex flex-col gap-4">
                  <div
                    className="rounded-2xl p-5 flex flex-col gap-4"
                    style={{
                      background: "rgba(22,32,52,0.8)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400"><UsersIcon /></span>
                      <h3 className="text-sm font-semibold text-white">Resumo da equipe</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      {[
                        { label: "Total de membros",   value: members.length,    color: "#F1F5F9" },
                        { label: "Ativos",             value: totalAtivos,       color: "#6EE7B7" },
                        { label: "Com acesso admin",   value: totalAdmins,       color: "#93C5FD" },
                        { label: "Convites pendentes", value: totalPendentes,    color: "#FCD34D" },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="flex items-center justify-between py-2"
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                        >
                          <span className="text-xs text-slate-500">{s.label}</span>
                          <span className="text-sm font-bold font-display" style={{ color: s.color }}>
                            {s.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className="rounded-2xl p-5 flex flex-col gap-4"
                    style={{
                      background: "rgba(22,32,52,0.8)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <h3 className="text-sm font-semibold text-white">Distribuição de funções</h3>
                    <div className="flex flex-col gap-2.5">
                      {(["owner", "admin", "member"] as Role[]).map((role) => {
                        const count = members.filter((m) => m.role === role).length;
                        const pct   = members.length > 0 ? Math.round((count / members.length) * 100) : 0;
                        const cfg   = ROLE_CONFIG[role];
                        return (
                          <div key={role}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-500">{cfg.label}</span>
                              <span className="text-xs font-semibold" style={{ color: cfg.text }}>{count}</span>
                            </div>
                            <div
                              className="h-1.5 rounded-full overflow-hidden"
                              style={{ background: "rgba(255,255,255,0.06)" }}
                            >
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, background: cfg.text }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div
                    className="rounded-2xl p-4 flex gap-3"
                    style={{
                      background: "rgba(37,99,235,0.08)",
                      border: "1px solid rgba(59,130,246,0.18)",
                    }}
                  >
                    <span className="flex-shrink-0 mt-0.5 text-brand-400"><ShieldIcon /></span>
                    <div>
                      <p className="text-xs font-semibold text-brand-300 mb-0.5">Dica de segurança</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Revise permissões periodicamente. Remova membros inativos para manter o workspace seguro.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push("/membros/novo")}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 text-left"
                    style={{
                      background: "rgba(37,99,235,0.10)",
                      border: "1px dashed rgba(59,130,246,0.3)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(37,99,235,0.18)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(37,99,235,0.10)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)"; }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(37,99,235,0.2)" }}
                    >
                      <span className="text-brand-400"><LockIcon /></span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-300">Convidar membro</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">Enviar link de convite por e-mail</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <button
        type="button"
        onClick={() => router.push("/membros/novo")}
        className="sm:hidden fixed bottom-20 right-4 z-30 w-14 h-14 rounded-2xl flex items-center justify-center text-white cursor-pointer transition-all duration-200 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
          boxShadow: "0 4px 20px rgba(37,99,235,0.5)",
        }}
        aria-label="Adicionar membro"
      >
        <PlusIcon />
      </button>

      <BottomNav />
    </div>
  );
}
