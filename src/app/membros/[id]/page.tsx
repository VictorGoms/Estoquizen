"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import PageLoader from "@/components/ui/PageLoader";
import PageError from "@/components/ui/PageError";
import AccessDenied from "@/components/ui/AccessDenied";
import { supabase } from "@/lib/supabase";
import { dbErrorPt } from "@/lib/dbMessages";
import { api } from "@/lib/api";
import { getWorkspace } from "@/hooks/useWorkspace";
import { useRole, can } from "@/hooks/useRole";
import { ArrowLeftIcon, CheckIcon, TrashIcon, Spinner } from "@/components/ui/icons";

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

const ROLE_CONFIG: Record<Role, { label: string; desc: string }> = {
  owner:  { label: "Proprietário",  desc: "Acesso total: membros, plano e configurações." },
  admin:  { label: "Administrador", desc: "Estoque, notas fiscais, métricas e equipe." },
  member: { label: "Membro",        desc: "Consulta o estoque e as métricas, sem editar." },
};

const STATUS_OPTIONS: Array<{ id: Status; label: string; dot: string }> = [
  { id: "ativo",    label: "Ativo",    dot: "bg-ok" },
  { id: "pendente", label: "Pendente", dot: "bg-low" },
  { id: "inativo",  label: "Inativo",  dot: "bg-fg-subtle" },
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
  const [saveError, setSaveError] = useState("");

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
        setError(err && err.code !== "PGRST116" ? dbErrorPt(err, "Não foi possível carregar o membro.") : "Membro não encontrado");
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
        avatarColor: prof?.avatar_color ?? "#1d2840",
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
    setSaveError("");

    const ws = getWorkspace();
    try {
      if (!ws) throw new Error("Nenhum workspace selecionado.");
      await api.patch(`/members/${member.userId}?workspace_id=${ws.id}`, { role, status });
    } catch (err) {
      setSaving(false);
      setSaveError(err instanceof Error ? err.message : "Não foi possível salvar.");
      return;
    }
    setSaving(false);
    setOriginalRole(role);
    setOriginalStatus(status);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleRemove() {
    if (!member) return;
    setRemoving(true);
    const ws = getWorkspace();
    try {
      if (!ws) throw new Error("Nenhum workspace selecionado.");
      await api.delete(`/members/${member.userId}?workspace_id=${ws.id}`);
    } catch (err) {
      setRemoving(false);
      setConfirm(false);
      setSaveError(err instanceof Error ? err.message : "Não foi possível remover o membro.");
      return;
    }
    router.push("/membros");
  }

  const isDirty   = role !== originalRole || status !== originalStatus;
  /* Só o owner altera ou remove outro owner e promove alguém a owner (o banco também bloqueia) */
  const canEditOwner = can(wsRole, "canEditOwnerRole");
  const lockedOwner  = originalRole === "owner" && !canEditOwner;
  const roleOptions  = (Object.keys(ROLE_CONFIG) as Role[]).filter((r) => r !== "owner" || canEditOwner);
  /* O cartão mostra o que está salvo; o formulário, a escolha ainda não salva */
  const statusCfg = STATUS_OPTIONS.find((s) => s.id === originalStatus)!;

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <PageError message={error || "Membro não encontrado"} onRetry={() => router.push("/membros")} />
      </div>
    );
  }

  if (!can(wsRole, "canEditMembro")) return <AccessDenied />;

  return (
    <div className="min-h-screen bg-ink">
      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      <main className="lg:pl-64 pt-14 pb-28 lg:pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5 lg:gap-6">

          <nav aria-label="Trilha" className="flex items-center gap-2.5 min-w-0 text-sm font-bold text-fg-muted">
            <Link href="/membros" className="flex items-center gap-2 min-h-[40px] pl-3 pr-4 rounded-full bg-surface text-fg font-extrabold flex-shrink-0 hover:bg-surface-2 transition-colors">
              <ArrowLeftIcon className="w-4 h-4" strokeWidth={2.4} /> Membros
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="truncate">{member.name}</span>
          </nav>

          <div className="grid lg:grid-cols-[340px_minmax(0,1fr)] gap-5 lg:gap-6 items-start">

            {/* ── Cartão do membro ── */}
            <div className="flex flex-col gap-4">
              <section className="bg-surface rounded-5xl p-6 flex flex-col items-center gap-4 text-center">
                {member.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <span className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-fg" style={{ background: member.avatarColor }}>
                    {member.initials}
                  </span>
                )}
                <div className="min-w-0">
                  <h1 className="text-xl font-black break-words">{member.name}</h1>
                  <p className="text-sm font-bold text-fg-muted break-all">{member.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-surface-2 text-fg-soft">{ROLE_CONFIG[originalRole].label}</span>
                  <span className="flex items-center gap-1.5 text-xs font-extrabold text-fg-muted">
                    <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>
                </div>
                <dl className="w-full flex flex-col text-sm">
                  <div className="flex justify-between gap-3 py-3 border-t-2 border-dashed border-white/[0.08]">
                    <dt className="font-bold text-fg-muted">Membro desde</dt>
                    <dd className="font-extrabold">{member.joinedAt}</dd>
                  </div>
                </dl>
              </section>

              {lockedOwner ? null : !confirm ? (
                <button
                  type="button"
                  onClick={() => setConfirm(true)}
                  className="min-h-[48px] flex items-center justify-center gap-2 rounded-full bg-zero/10 text-zero text-[15px] font-extrabold cursor-pointer hover:bg-zero/20 transition-colors"
                >
                  <TrashIcon className="w-[18px] h-[18px]" /> Remover do workspace
                </button>
              ) : (
                <div role="alertdialog" aria-labelledby="remover-titulo" className="bg-surface rounded-4xl p-4 flex flex-col gap-3 ring-1 ring-zero/30">
                  <p id="remover-titulo" className="text-[15px] font-black">Remover {member.name}?</p>
                  <p className="text-sm font-bold text-fg-muted">O acesso ao workspace acaba na hora.</p>
                  <div className="flex gap-2.5">
                    <button type="button" onClick={() => setConfirm(false)} className="flex-1 min-h-[44px] rounded-full bg-surface-2 text-sm font-extrabold cursor-pointer hover:bg-white/10">
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleRemove}
                      disabled={removing}
                      className="flex-1 min-h-[44px] rounded-full bg-zero text-ink text-sm font-black cursor-pointer disabled:opacity-60"
                    >
                      {removing ? "Removendo…" : "Remover"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Edição ── */}
            {lockedOwner ? (
              <p className="bg-surface rounded-5xl p-5 lg:p-6 text-[15px] font-bold text-fg-muted">
                Só o dono pode alterar ou remover outro dono do workspace.
              </p>
            ) : (
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <fieldset className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-3">
                <legend className="sr-only">Função no workspace</legend>
                <p className="text-lg font-black" aria-hidden="true">Função no workspace</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {roleOptions.map((r) => {
                    const cfg    = ROLE_CONFIG[r];
                    const active = role === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setRole(r)}
                        className={`text-left p-4 rounded-4xl flex flex-col gap-1 cursor-pointer transition-colors ${
                          active ? "bg-inverse text-ink" : "bg-surface-2 text-fg hover:bg-white/10"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[15px] font-black">{cfg.label}</span>
                          <span aria-hidden="true" className={`w-6 h-6 rounded-full flex items-center justify-center ${active ? "bg-ink text-accent" : "ring-2 ring-white/15"}`}>
                            {active && <CheckIcon className="w-3.5 h-3.5" strokeWidth={3} />}
                          </span>
                        </span>
                        <span className={`text-[13px] font-bold leading-relaxed ${active ? "text-inverse-muted" : "text-fg-muted"}`}>{cfg.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-3">
                <legend className="sr-only">Status da conta</legend>
                <p className="text-lg font-black" aria-hidden="true">Status da conta</p>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTIONS.map((s) => {
                    const active = status === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setStatus(s.id)}
                        className={`flex items-center gap-2 min-h-[44px] px-4 rounded-full text-sm cursor-pointer transition-colors ${
                          active ? "bg-inverse text-ink font-black" : "bg-surface-2 text-fg-soft font-extrabold hover:text-fg"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {saveError && <p role="alert" className="text-sm font-bold text-zero">{saveError}</p>}

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <Link href="/membros" className="sm:w-40 min-h-[54px] flex items-center justify-center rounded-full bg-surface text-[15px] font-extrabold hover:bg-surface-2 transition-colors">
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={saving || !isDirty}
                  className="flex-1 min-h-[54px] flex items-center justify-center gap-2 rounded-full bg-accent text-ink text-base font-black cursor-pointer hover:brightness-110 transition-[filter] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? <Spinner /> : saved ? <CheckIcon /> : null}
                  {saving ? "Salvando…" : saved ? "Salvo!" : "Salvar alterações"}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
