"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import PageLoader from "@/components/ui/PageLoader";
import PageError from "@/components/ui/PageError";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { getWorkspace } from "@/hooks/useWorkspace";
import { useRole, can } from "@/hooks/useRole";
import { PlusIcon, SearchIcon, ArrowRightIcon, UsersIcon, MailIcon } from "@/components/ui/icons";

type Role   = "owner" | "admin" | "member";
type Status = "ativo" | "pendente" | "inativo";

interface Member {
  id: string;        // workspace_members.id
  userId: string;    // auth user id
  name: string;
  email: string;
  role: Role;
  status: Status;
  initials: string;
  avatarColor: string;
  avatarUrl:   string | null;
}

interface ApiMemberRow {
  id:       string;
  user_id:  string;
  role:     string;
  status:   string;
  profiles: {
    name?:         string | null;
    email?:        string | null;
    avatar_color?: string | null;
    avatar_url?:   string | null;
  } | null;
}

/* Equipe por plano (EQZ-27): 3 / 10 / sem limite no Pro (null) */
const MEMBER_LIMITS: Record<string, number | null> = { basic: 3, growth: 10, pro: null };

const ROLE_LABEL: Record<Role, string> = {
  owner:  "Proprietário",
  admin:  "Administrador",
  member: "Membro",
};

const ROLE_FILTERS = [
  { id: "todos",  label: "Todos" },
  { id: "owner",  label: "Proprietários" },
  { id: "admin",  label: "Administradores" },
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
  const role   = useRole();
  const canAdd = can(role, "canAddMembro");

  const [tab, setTab]               = useState<"ativos" | "pendentes">("ativos");
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [members, setMembers]       = useState<Member[]>([]);
  const [wsName, setWsName]         = useState("");
  const [wsId, setWsId]             = useState("");
  const [wsPlan, setWsPlan]         = useState<string>("");
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [revoking, setRevoking]     = useState<string | null>(null);
  const [confirmId, setConfirmId]   = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState("");

  useEffect(() => {
    async function load() {
      const ws = getWorkspace();
      if (!ws) { router.push("/select-workspace"); return; }
      setWsName(ws.name);
      setWsId(ws.id);

      const { data: wsData } = await supabase
        .from("workspaces")
        .select("plan")
        .eq("id", ws.id)
        .single();
      if (wsData) setWsPlan(wsData.plan);

      let memberRows: ApiMemberRow[];
      try {
        memberRows = await api.get<ApiMemberRow[]>(`/members?workspace_id=${ws.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar membros");
        setLoading(false);
        return;
      }

      setMembers(
        (memberRows ?? []).map((row) => {
          const prof = row.profiles;
          const name = prof?.name ?? prof?.email?.split("@")[0] ?? "Convite pendente";
          return {
            id:          row.id,
            userId:      row.user_id,
            name,
            email:       prof?.email ?? "",
            role:        row.role as Role,
            status:      row.status as Status,
            initials:    getInitials(name),
            avatarColor: prof?.avatar_color ?? "#1d2840",
            avatarUrl:   prof?.avatar_url ?? null,
          };
        })
      );
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleRevoke(member: Member) {
    setRevoking(member.userId);
    setRevokeError("");
    try {
      await api.delete(`/members/${member.userId}/invite?workspace_id=${wsId}`);
      setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
    } catch (err) {
      setRevokeError(err instanceof Error ? err.message : "Erro ao revogar convite");
    } finally {
      setRevoking(null);
      setConfirmId(null);
    }
  }

  const ativos    = members.filter((m) => m.status === "ativo");
  const pendentes = members.filter((m) => m.status === "pendente");

  const filtered = (tab === "ativos" ? ativos : pendentes).filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = tab === "pendentes" || roleFilter === "todos" || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalAtivos    = ativos.length;
  const totalAdmins    = members.filter((m) => m.role === "owner" || m.role === "admin").length;
  const totalPendentes = pendentes.length;
  const membersUsed    = totalAtivos + totalPendentes;
  const memberLimit    = wsPlan ? (MEMBER_LIMITS[wsPlan] ?? null) : null;
  const atLimit        = memberLimit !== null && membersUsed >= memberLimit;

  return (
    <div className="min-h-screen bg-ink">
      <DashboardSidebar workspaceName={wsName} />
      <DashboardTopBar  workspaceName={wsName} />

      <main className="lg:pl-64 pt-14 pb-28 lg:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5 lg:gap-6">

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight leading-tight">Membros</h1>
              <p className="text-sm lg:text-[15px] font-bold text-fg-muted">
                {loading ? "Carregando…" : `${members.length} pessoa${members.length !== 1 ? "s" : ""} no workspace`}
              </p>
            </div>
            {canAdd && (
              <Link
                href="/membros/novo"
                aria-label="Convidar membro"
                className="flex items-center gap-2.5 min-h-[52px] sm:min-h-[48px] w-[52px] sm:w-auto justify-center sm:px-[22px] rounded-full bg-accent text-ink text-[15px] font-black hover:brightness-110 transition-[filter]"
              >
                <PlusIcon className="w-6 h-6 sm:w-5 sm:h-5" strokeWidth={2.6} />
                <span className="hidden sm:inline">Convidar membro</span>
              </Link>
            )}
          </div>

          {loading ? (
            <PageLoader />
          ) : error ? (
            <PageError message={error} onRetry={() => { setError(""); setLoading(true); }} />
          ) : (
            <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-5 lg:gap-6 items-start">

              {/* ── Lista ── */}
              <div className="flex flex-col gap-4 min-w-0">
                <div role="group" aria-label="Situação" className="flex gap-1 p-[5px] rounded-full bg-surface w-fit">
                  {([
                    { id: "ativos",    label: "Ativos",    count: totalAtivos },
                    { id: "pendentes", label: "Pendentes", count: totalPendentes },
                  ] as const).map((t) => {
                    const active = tab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => { setTab(t.id); setSearch(""); setRoleFilter("todos"); }}
                        className={`flex items-center gap-2 min-h-[42px] pl-4 pr-2.5 rounded-full text-sm cursor-pointer transition-colors ${
                          active ? "bg-inverse text-ink font-black" : "text-fg-soft font-extrabold hover:text-fg"
                        }`}
                      >
                        {t.label}
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full ${active ? "bg-ink text-fg" : "bg-surface-2 text-fg"}`}>{t.count}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex-1 flex items-center gap-2.5 h-[52px] px-[18px] rounded-full bg-surface focus-within:ring-2 focus-within:ring-accent">
                    <SearchIcon className="w-5 h-5 text-fg-subtle flex-shrink-0" />
                    <input
                      type="search"
                      name="busca-membro"
                      autoComplete="off"
                      aria-label="Buscar por nome ou e-mail"
                      placeholder="Buscar por nome ou e-mail"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="flex-1 min-w-0 h-full bg-transparent text-fg text-[15px] font-semibold outline-none placeholder:text-fg-subtle"
                    />
                  </label>
                  {tab === "ativos" && (
                    <div role="group" aria-label="Filtrar por papel" className="flex gap-2 overflow-x-auto scrollbar-none">
                      {ROLE_FILTERS.map((f) => {
                        const active = roleFilter === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setRoleFilter(f.id)}
                            className={`flex-shrink-0 min-h-[44px] px-4 rounded-full text-sm cursor-pointer transition-colors ${
                              active ? "bg-inverse text-ink font-black" : "bg-surface text-fg-soft font-extrabold hover:text-fg"
                            }`}
                          >
                            {f.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {revokeError && <p role="alert" className="text-sm font-bold text-zero bg-zero/10 rounded-2xl px-4 py-3">{revokeError}</p>}

                {filtered.length > 0 ? (
                  <ul className="flex flex-col gap-2.5">
                    {filtered.map((member) => {
                      const isPending = member.status === "pendente";
                      const avatar = member.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={member.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <span
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-black flex-shrink-0 ${isPending ? "bg-low/15 text-low" : "text-fg"}`}
                          style={isPending ? undefined : { background: member.avatarColor }}
                        >
                          {isPending ? <MailIcon className="w-5 h-5" /> : member.initials}
                        </span>
                      );
                      const roleChip = (
                        <span className="hidden sm:inline-flex flex-shrink-0 text-xs font-black px-2.5 py-1 rounded-full bg-surface-2 text-fg-soft">
                          {ROLE_LABEL[member.role]}
                        </span>
                      );

                      if (!isPending) {
                        return (
                          <li key={member.id}>
                            <Link href={`/membros/${member.id}`} className="flex items-center gap-3.5 p-3 pr-4 rounded-[22px] bg-surface hover:bg-[#19243a] transition-colors">
                              {avatar}
                              <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                                <span className="text-[15px] font-extrabold truncate">{member.name}</span>
                                <span className="text-[13px] font-bold text-fg-muted truncate">
                                  {member.email}<span className="sm:hidden"> · {ROLE_LABEL[member.role]}</span>
                                </span>
                              </span>
                              {roleChip}
                              <ArrowRightIcon className="w-[18px] h-[18px] text-fg-subtle flex-shrink-0" />
                            </Link>
                          </li>
                        );
                      }

                      return (
                        <li key={member.id} className="flex flex-wrap items-center gap-3.5 p-3 pr-4 rounded-[22px] bg-surface ring-1 ring-low/20">
                          {avatar}
                          <span className="flex-1 min-w-[140px] flex flex-col gap-0.5">
                            <span className="text-[15px] font-extrabold truncate">{member.name}</span>
                            <span className="text-[13px] font-bold text-low">Aguardando aceite · {ROLE_LABEL[member.role]}</span>
                          </span>
                          {canAdd && (
                            confirmId === member.userId ? (
                              <span className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-sm font-bold text-fg-muted">Revogar?</span>
                                <button
                                  type="button"
                                  disabled={revoking === member.userId}
                                  onClick={() => handleRevoke(member)}
                                  className="min-h-[40px] px-4 rounded-full bg-zero text-ink text-sm font-black cursor-pointer disabled:opacity-50"
                                >
                                  {revoking === member.userId ? "…" : "Sim"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmId(null)}
                                  className="min-h-[40px] px-4 rounded-full bg-surface-2 text-sm font-extrabold cursor-pointer hover:bg-white/10"
                                >
                                  Não
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmId(member.userId)}
                                className="flex-shrink-0 min-h-[40px] px-4 rounded-full bg-zero/10 text-zero text-sm font-extrabold cursor-pointer hover:bg-zero/20 transition-colors"
                              >
                                Revogar convite
                              </button>
                            )
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center bg-surface rounded-5xl">
                    <span className="w-16 h-16 rounded-full bg-surface-2 text-fg-muted flex items-center justify-center">
                      <UsersIcon className="w-7 h-7" />
                    </span>
                    <div>
                      <p className="font-black">{tab === "pendentes" ? "Nenhum convite pendente" : "Nenhum membro encontrado"}</p>
                      <p className="text-sm font-bold text-fg-muted mt-1">
                        {tab === "pendentes" ? "Todos os convites foram aceitos ou revogados." : "Tente outro termo ou filtro."}
                      </p>
                    </div>
                    {(search || roleFilter !== "todos") && (
                      <button
                        type="button"
                        onClick={() => { setSearch(""); setRoleFilter("todos"); }}
                        className="min-h-[44px] px-5 rounded-full bg-surface-2 text-sm font-extrabold cursor-pointer hover:bg-white/10"
                      >
                        Limpar filtros
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* ── Resumo ── */}
              <aside className="flex flex-col gap-4">
                <section className="bg-surface rounded-5xl p-5 flex flex-col gap-4">
                  <h2 className="text-lg font-black">Resumo da equipe</h2>
                  <dl className="grid grid-cols-2 gap-2.5">
                    {[
                      { label: "No total",           value: members.length },
                      { label: "Ativos",             value: totalAtivos },
                      { label: "Com acesso admin",   value: totalAdmins },
                      { label: "Convites pendentes", value: totalPendentes },
                    ].map((s) => (
                      <div key={s.label} className="flex flex-col gap-0.5 rounded-3xl bg-surface-2 p-3.5">
                        <dt className="order-2 text-[13px] font-bold text-fg-muted">{s.label}</dt>
                        <dd className="order-1 text-2xl font-black">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                {memberLimit !== null && (
                  <section className="bg-surface rounded-5xl p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-black">Limite do plano</h2>
                      <span className={`text-sm font-black ${atLimit ? "text-zero" : ""}`}>{membersUsed}/{memberLimit}</span>
                    </div>
                    <div aria-hidden="true" className="h-2.5 rounded-full bg-ink overflow-hidden">
                      <div
                        className={`h-full rounded-full ${atLimit ? "bg-zero" : "bg-accent"}`}
                        style={{ width: `${Math.min(100, memberLimit > 0 ? (membersUsed / memberLimit) * 100 : 0)}%` }}
                      />
                    </div>
                    <p className="text-[13px] font-bold text-fg-muted">
                      {atLimit ? "Limite atingido: mude de plano em Configurações para convidar mais pessoas." : "Conta ativos e convites pendentes."}
                    </p>
                  </section>
                )}
              </aside>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
