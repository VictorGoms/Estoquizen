"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import ActionCard from "@/components/dashboard/ActionCard";
import BottomNav from "@/components/dashboard/BottomNav";
import StatCard from "@/components/dashboard/StatCard";
import PageLoader from "@/components/ui/PageLoader";
import { supabase } from "@/lib/supabase";
import { getWorkspace, setWorkspace, type WorkspaceRole } from "@/hooks/useWorkspace";
import { can } from "@/hooks/useRole";
import { useStats } from "@/hooks/useStats";

/* ─── Icons ─── */
const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const BoxIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
const TrendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);
const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const ScanIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8H3m2 8H3m18-8h-2M7 20H4m17-8h2M7 4H4m17 0h-2M7 20v-4m10-8v3m0 0h.01m-9.01 0h-.01M12 8V4m0 16v-4" />
  </svg>
);
const TeamIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const RocketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

function getGreeting() {
  const h = Number(
    new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "numeric", hour12: false })
  );
  if (h >= 6 && h < 12) return "Bom dia";
  if (h >= 12 && h < 18) return "Boa tarde";
  return "Boa noite"; // 18–23 e 00–05
}

interface Stats { produtos: number; alertas: number; ultimaMov: number }

export default function DashboardPage() {
  const router = useRouter();
  const [greeting, setGreeting]     = useState("");
  const [userName, setUserName]     = useState("");
  const [wsName, setWsName]         = useState("");
  const [wsId, setWsId]             = useState<string | undefined>(undefined);
  const [role, setRole]             = useState<WorkspaceRole>("member");
  const [loading, setLoading]       = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);

  /* ── Cache SWR: stats aparecem instantâneo ao voltar ao dashboard ── */
  const { stats: rawStats, loading: statsLoading } = useStats(wsId);
  const stats: Stats = {
    produtos:  rawStats?.produtos  ?? 0,
    alertas:   rawStats?.alertas   ?? 0,
    ultimaMov: rawStats?.movimentacoes ?? 0,
  };

  useEffect(() => {
    setGreeting(getGreeting());

    async function load() {
      const ws = getWorkspace();
      if (!ws) { router.push("/select-workspace"); return; }
      setWsName(ws.name);
      setWsId(ws.id);

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        Promise.all([
          supabase.from("profiles").select("name").eq("id", user.id).single(),
          supabase.from("workspace_members").select("role").eq("workspace_id", ws.id).eq("user_id", user.id).eq("status", "ativo").single(),
        ]).then(([{ data: profile }, { data: memberData }]) => {
          setUserName(profile?.name ?? user.email?.split("@")[0] ?? "");
          const freshRole = (memberData?.role ?? ws.role) as WorkspaceRole;
          if (freshRole !== ws.role) setWorkspace({ ...ws, role: freshRole });
          setRole(freshRole);
        });
      }

      setLoading(false);
    }
    load();
  }, [router]);

  const SECONDARY_ACTIONS = [
    { id: "estoque",  icon: <BoxIcon />,   title: "Estoque",    description: "Visualize e gerencie seus produtos",  href: "/estoque",            iconBg: "rgba(29,78,216,0.15)",  iconColor: "#60A5FA", badge: undefined, adminOnly: false },
    { id: "membros",  icon: <TeamIcon />,  title: "Membros",    description: "Gerencie usuários e permissões",      href: "/membros",            iconBg: "rgba(217,119,6,0.15)", iconColor: "#FCD34D", badge: undefined, adminOnly: false },
    { id: "metricas", icon: <ChartIcon />, title: "Dashboards", description: "Relatórios e métricas em tempo real", href: "/dashboard-metricas", iconBg: "rgba(124,58,237,0.15)", iconColor: "#C4B5FD", badge: undefined, adminOnly: true  },
  ].filter((a) => !a.adminOnly || can(role, "canAccessNota"));

  return (
    <div className="min-h-screen bg-navy-900 relative overflow-hidden">
      <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ width: "900px", height: "500px", background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.12) 0%, transparent 70%)" }}
      />

      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      <main className="lg:pl-60 pt-14 pb-24 md:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 lg:py-8 flex flex-col gap-5 lg:gap-7">

            {loading ? <PageLoader /> : (
              <>
                <div>
                  <p suppressHydrationWarning className="text-white font-display font-bold text-xl">{greeting || "Bem-vindo de volta"}{userName ? `, ${userName}` : ""} 👋</p>
                  <p className="text-slate-500 text-sm mt-1">Sua operação está rodando suavemente.</p>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
                  {statsLoading ? (
                    [1,2,3].map((i) => (
                      <div key={i} className="flex-shrink-0 w-36 h-20 rounded-2xl animate-pulse"
                        style={{ background: "rgba(22,32,52,0.8)", border: "1px solid rgba(255,255,255,0.06)" }} />
                    ))
                  ) : (
                    <>
                      <StatCard label="Produtos"      value={String(stats.produtos)}  sub="cadastrados"    accent="blue"    icon={<BoxIcon />} />
                      <StatCard label="Estoque baixo" value={String(stats.alertas)}   sub="alertas ativos" accent="amber"   icon={<AlertIcon />} />
                      <StatCard label="Movimentações" value={String(stats.ultimaMov)} sub="registradas"    accent="emerald" icon={<TrendIcon />} />
                    </>
                  )}
                </div>

                {/* CTA principal — scanner (visível a todos) */}
                <button type="button" onClick={() => router.push("/scanner")}
                  className="w-full text-left rounded-2xl p-5 cursor-pointer transition-all duration-200 relative overflow-hidden group"
                  style={{ background: "linear-gradient(135deg, #047857 0%, #059669 55%, #10b981 100%)", boxShadow: "0 8px 32px rgba(5,150,105,0.45)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}
                >
                  <div aria-hidden="true" className="absolute -right-8 -top-8 w-36 h-36 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
                  <div className="flex items-start justify-between gap-4 relative">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest mb-3 px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                        Ação principal
                      </div>
                      <h2 className="font-display font-extrabold text-xl text-white leading-tight">Escanear produto</h2>
                      <p className="text-emerald-100/80 text-sm mt-1.5">Use a câmera para registrar entrada/saída</p>
                    </div>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white group-hover:scale-110 transition-transform duration-200" style={{ background: "rgba(255,255,255,0.18)" }}>
                      <ScanIcon />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-white/90">
                    <RocketIcon /> Acessar agora <ArrowRightIcon />
                  </div>
                </button>

                <div>
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium mb-3">Acesso rápido</p>
                  <div className="flex flex-col gap-3">

                    {/* 1 — Estoque */}
                    {SECONDARY_ACTIONS.filter((a) => a.id === "estoque").map((a) => (
                      <ActionCard key={a.id} icon={a.icon} title={a.title} description={a.description}
                        iconBg={a.iconBg} iconColor={a.iconColor} badge={a.badge}
                        onClick={() => router.push(a.href)} />
                    ))}

                    {/* 2 — Adicionar produto (accordion) */}
                    <div className="flex flex-col rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                      <button
                        type="button"
                        onClick={() => setShowAddMenu((v) => !v)}
                        className="group w-full text-left p-4 sm:p-5 flex items-center gap-4 cursor-pointer transition-all duration-200"
                        style={{ background: showAddMenu ? "rgba(30,41,59,0.9)" : "rgba(30,41,59,0.6)" }}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                          style={{ background: "rgba(5,150,105,0.15)", color: "#6EE7B7", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <PlusIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-display font-semibold text-sm text-white">Adicionar produto</span>
                          <p className="text-xs text-slate-500 mt-0.5">Manual, scanner ou importação automática</p>
                        </div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0 text-slate-600 transition-transform duration-200"
                          style={{ transform: showAddMenu ? "rotate(180deg)" : "rotate(0deg)" }}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <div
                        className="overflow-hidden transition-all duration-300"
                        style={{ maxHeight: showAddMenu ? "300px" : "0px" }}
                      >
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,23,42,0.5)" }}>

                          <button
                            type="button"
                            onClick={() => router.push("/estoque/novo")}
                            className="w-full text-left px-5 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors duration-150"
                          >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: "rgba(5,150,105,0.15)", color: "#6EE7B7" }}>
                              <PlusIcon />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">Adicionar manualmente</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">Preencha os dados do produto</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => router.push("/scanner")}
                            className="w-full text-left px-5 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors duration-150"
                            style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                          >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: "rgba(5,150,105,0.15)", color: "#6EE7B7" }}>
                              <ScanIcon />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">Escanear produto</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">Cadastre pelo código de barras com a câmera</p>
                            </div>
                          </button>

                          {can(role, "canAccessNota") && (
                            <button
                              type="button"
                              onClick={() => router.push("/nota")}
                              className="w-full text-left px-5 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors duration-150"
                              style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                            >
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: "rgba(29,78,216,0.15)", color: "#60A5FA" }}>
                                <DocumentIcon />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">Importar automaticamente</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Via XML ou NFC-e em segundos</p>
                              </div>
                            </button>
                          )}

                        </div>
                      </div>
                    </div>

                    {/* 3, 4 — Membros e Dashboards */}
                    {SECONDARY_ACTIONS.filter((a) => a.id !== "estoque").map((a) => (
                      <ActionCard key={a.id} icon={a.icon} title={a.title} description={a.description}
                        iconBg={a.iconBg} iconColor={a.iconColor} badge={a.badge}
                        onClick={() => router.push(a.href)} />
                    ))}

                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
