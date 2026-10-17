"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import { getWorkspace } from "@/hooks/useWorkspace";
import { sanitizeEmail } from "@/lib/sanitize";
import { api } from "@/lib/api";
import { useRole, can } from "@/hooks/useRole";
import AccessDenied from "@/components/ui/AccessDenied";
import PageLoader from "@/components/ui/PageLoader";
import FormField, { inputClass } from "@/components/ui/FormField";
import { ArrowLeftIcon, CheckIcon, MailIcon, Spinner } from "@/components/ui/icons";

/* ─── Types ─── */
type Role = "owner" | "admin" | "member";

const ROLES: Array<{ id: Role; label: string; description: string }> = [
  {
    id: "owner",
    label: "Proprietário",
    description: "Acesso total: membros, plano, faturamento e configurações do workspace.",
  },
  {
    id: "admin",
    label: "Administrador",
    description: "Cuida do estoque, das notas fiscais, das métricas e da equipe.",
  },
  {
    id: "member",
    label: "Membro",
    description: "Consulta o estoque e as métricas, sem editar.",
  },
];

export default function NovoMembroPage() {
  const router = useRouter();
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [role, setRole]       = useState<Role>("member");
  const wsRole = useRole();
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");
  const [wsName, setWsName]   = useState("");

  useEffect(() => {
    const ws = getWorkspace();
    if (ws) setWsName(ws.name);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim())  { setError("Nome é obrigatório."); return; }
    if (!email.trim()) return;
    const ws = getWorkspace();
    if (!ws) { setError("Nenhum workspace selecionado."); return; }

    setLoading(true);
    setError("");
    try {
      const cleanEmail = sanitizeEmail(email);

      await api.post("/members/invite", {
        email:        cleanEmail,
        name:         name.trim(),
        role,
        workspace_id: ws.id,
      });

      setSent(true);
      setTimeout(() => router.push("/membros"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar convite");
    } finally {
      setLoading(false);
    }
  }

  const selectedRole = ROLES.find((r) => r.id === role)!;

  if (wsRole === null) return <PageLoader />;
  if (!can(wsRole, "canAddMembro")) return <AccessDenied />;

  return (
    <div className="min-h-screen bg-ink">
      <DashboardSidebar workspaceName={wsName} />
      <DashboardTopBar  workspaceName={wsName} />

      <main className="lg:pl-64 pt-14 pb-28 lg:pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5">

          <Link href="/membros" className="w-fit flex items-center gap-2 min-h-[40px] pl-3 pr-4 rounded-full bg-surface text-sm text-fg font-extrabold hover:bg-surface-2 transition-colors">
            <ArrowLeftIcon className="w-4 h-4" strokeWidth={2.4} /> Membros
          </Link>

          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight leading-tight">Convidar membro</h1>
            <p className="text-sm lg:text-[15px] font-bold text-fg-muted">O convite chega por e-mail com o link de acesso ao workspace.</p>
          </div>

          {sent ? (
            <div role="status" className="bg-surface rounded-5xl p-8 flex flex-col items-center gap-4 text-center">
              <span className="w-16 h-16 rounded-full bg-accent text-ink flex items-center justify-center">
                <CheckIcon className="w-8 h-8" strokeWidth={2.6} />
              </span>
              <div>
                <p className="text-xl font-black">Convite enviado!</p>
                <p className="text-sm font-bold text-fg-muted mt-1">Voltando para a lista de membros…</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <section className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-4">
                <h2 className="text-lg font-black">Quem você quer convidar?</h2>
                <FormField label="Nome" htmlFor="convite-nome" required>
                  <input id="convite-nome" type="text" autoComplete="off" placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                </FormField>
                <FormField label="E-mail" htmlFor="convite-email" required>
                  <input id="convite-email" type="email" autoComplete="off" spellCheck={false} placeholder="email@exemplo.com" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                </FormField>
              </section>

              <fieldset className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-3">
                <legend className="sr-only">Função no workspace</legend>
                <p className="text-lg font-black" aria-hidden="true">Função no workspace</p>
                <div className="flex flex-col gap-2.5">
                  {ROLES.map((r) => {
                    const active = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setRole(r.id)}
                        className={`text-left p-4 rounded-4xl flex items-start gap-3 cursor-pointer transition-colors ${
                          active ? "bg-inverse text-ink" : "bg-surface-2 text-fg hover:bg-white/10"
                        }`}
                      >
                        <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                          <span className="text-[15px] font-black">{r.label}</span>
                          <span className={`text-[13px] font-bold leading-relaxed ${active ? "text-inverse-muted" : "text-fg-muted"}`}>{r.description}</span>
                        </span>
                        <span
                          aria-hidden="true"
                          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${active ? "bg-ink text-accent" : "ring-2 ring-white/15"}`}
                        >
                          {active && <CheckIcon className="w-4 h-4" strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {error && <p role="alert" className="text-sm font-bold text-zero text-center">{error}</p>}

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <Link
                  href="/membros"
                  className="sm:w-40 min-h-[54px] flex items-center justify-center rounded-full bg-surface text-[15px] font-extrabold hover:bg-surface-2 transition-colors"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="flex-1 min-h-[54px] flex items-center justify-center gap-2 rounded-full bg-accent text-ink text-base font-black cursor-pointer hover:brightness-110 transition-[filter] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Spinner /> : <MailIcon />}
                  {loading ? "Enviando…" : `Enviar convite como ${selectedRole.label}`}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
