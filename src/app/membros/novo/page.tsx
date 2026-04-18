"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import { supabase } from "@/lib/supabase";
import { getWorkspace } from "@/hooks/useWorkspace";
import { sanitizeEmail } from "@/lib/sanitize";
import { useRole, can } from "@/hooks/useRole";
import AccessDenied from "@/components/ui/AccessDenied";
import PageLoader from "@/components/ui/PageLoader";

/* ─── Icons ─── */
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);
const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

/* ─── Types ─── */
type Role = "owner" | "admin" | "member";

const ROLES: Array<{ id: Role; label: string; description: string; bg: string; text: string; border: string }> = [
  {
    id: "owner",
    label: "Owner",
    description: "Acesso total — gerencia membros, planos, faturamento e configurações do workspace",
    bg: "rgba(217,119,6,0.12)",
    text: "#FCD34D",
    border: "rgba(245,158,11,0.35)",
  },
  {
    id: "admin",
    label: "Administrador",
    description: "Gerencia estoque, notas fiscais, relatórios e membros da equipe",
    bg: "rgba(37,99,235,0.12)",
    text: "#93C5FD",
    border: "rgba(59,130,246,0.3)",
  },
  {
    id: "member",
    label: "Membro",
    description: "Acesso operacional — visualiza e movimenta itens do estoque",
    bg: "rgba(5,150,105,0.12)",
    text: "#6EE7B7",
    border: "rgba(16,185,129,0.3)",
  },
];

const MOCK_WORKSPACE = {
  name: "Loja Central",
  initials: "V",
  userName: "Victor",
  email: "victor@email.com",
};

export default function NovoMembroPage() {
  const router = useRouter();
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [role, setRole]       = useState<Role>("member");
  const wsRole = useRole();
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    const ws = getWorkspace();
    if (!ws) { setError("Nenhum workspace selecionado."); return; }

    setLoading(true);
    setError("");
    try {
      const cleanEmail = sanitizeEmail(email);

      const { error: rpcErr } = await supabase.rpc("invite_member", {
        p_workspace_id: ws.id,
        p_email:        cleanEmail,
        p_role:         role,
      });

      // Se o usuário não tem conta ainda, envia convite por email via Edge Function
      if (rpcErr) {
        const isNotFound = rpcErr.message.includes("não encontrado");
        if (!isNotFound) throw new Error(rpcErr.message);

        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/invite-member`,
          {
            method: "POST",
            headers: {
              "Content-Type":  "application/json",
              "Authorization": `Bearer ${session?.access_token}`,
              "apikey":        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            },
            body: JSON.stringify({ email: cleanEmail, workspace_id: ws.id, role }),
          }
        );
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Erro ao enviar convite");
      }
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
    <div className="min-h-screen bg-navy-900 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "700px",
          height: "350px",
          background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.10) 0%, transparent 70%)",
        }}
      />

      <DashboardSidebar
        workspaceName={MOCK_WORKSPACE.name}
        userInitials={MOCK_WORKSPACE.initials}
        userName={MOCK_WORKSPACE.userName}
        userEmail={MOCK_WORKSPACE.email}
      />

      <DashboardTopBar
        workspaceName={MOCK_WORKSPACE.name}
        userInitials={MOCK_WORKSPACE.initials}
        userName={MOCK_WORKSPACE.userName}
      />

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
              <span className="text-slate-400 text-xs">Convidar membro</span>
            </div>

            {/* Content — centered form */}
            <div className="max-w-xl w-full mx-auto lg:mx-0">

              <div className="mb-6">
                <h1 className="font-display font-bold text-xl text-white">Convidar membro</h1>
                <p className="text-slate-500 text-sm mt-1">
                  Um convite será enviado por e-mail com link de acesso ao workspace.
                </p>
              </div>

              {sent ? (
                /* Success state */
                <div
                  className="rounded-2xl p-8 flex flex-col items-center gap-3 text-center"
                  style={{
                    background: "rgba(5,150,105,0.10)",
                    border: "1px solid rgba(16,185,129,0.25)",
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(5,150,105,0.2)" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#6EE7B7" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Convite enviado!</p>
                    <p className="text-slate-500 text-sm mt-1">Redirecionando para a lista de membros…</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                  {/* Name field */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                      Nome (opcional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
                        <UserIcon />
                      </span>
                      <input
                        type="text"
                        placeholder="Nome completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
                        style={{
                          background: "rgba(30,41,59,0.7)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                        onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                      />
                    </div>
                  </div>

                  {/* Email field */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                      E-mail <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
                        <MailIcon />
                      </span>
                      <input
                        type="email"
                        placeholder="email@exemplo.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
                        style={{
                          background: "rgba(30,41,59,0.7)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                        onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                      />
                    </div>
                  </div>

                  {/* Role selector */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2.5">
                      Função no workspace
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {ROLES.map((r) => {
                        const active = role === r.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setRole(r.id)}
                            className="text-left p-3.5 rounded-xl cursor-pointer transition-all duration-200"
                            style={{
                              background: active ? r.bg : "rgba(30,41,59,0.5)",
                              border: active ? `1px solid ${r.border}` : "1px solid rgba(255,255,255,0.07)",
                            }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold" style={{ color: active ? r.text : "#94A3B8" }}>
                                {r.label}
                              </span>
                              {active && (
                                <span
                                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{ background: r.border }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] leading-relaxed" style={{ color: active ? "#64748B" : "#334155" }}>
                              {r.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="text-xs text-red-400 text-center">{error}</p>
                  )}

                  {/* Submit */}
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
                      disabled={loading || !email.trim()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                      style={{
                        background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                        boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
                      }}
                    >
                      {loading ? (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <SendIcon />
                      )}
                      {loading ? "Enviando…" : `Enviar convite como ${selectedRole.label}`}
                    </button>
                  </div>

                </form>
              )}
            </div>

          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
