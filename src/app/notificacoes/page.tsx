"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import { supabase } from "@/lib/supabase";
import { getWorkspace } from "@/hooks/useWorkspace";

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);
const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
const BoxIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

interface AlertProduct { id: string; name: string; qty: number; min_qty: number }

export default function NotificacoesPage() {
  const router = useRouter();
  const [wsName, setWsName]         = useState("");
  const [userName, setUserName]     = useState("");
  const [alerts, setAlerts]         = useState<AlertProduct[]>([]);
  const [loading, setLoading]       = useState(true);

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

      const { data } = await supabase
        .from("products")
        .select("id, name, qty, min_qty")
        .eq("workspace_id", ws.id);

      const alerts = (data ?? []).filter((p) => p.qty === 0 || p.qty <= p.min_qty);
      setAlerts(alerts as AlertProduct[]);
      setLoading(false);
    }
    load();
  }, [router]);

  const zerados = alerts.filter((p) => p.qty === 0);
  const baixos  = alerts.filter((p) => p.qty > 0 && p.qty <= p.min_qty);

  return (
    <div className="min-h-screen bg-navy-900 relative overflow-hidden">
      <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ width: "700px", height: "350px", background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.09) 0%, transparent 70%)" }}
      />
      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      <main className="lg:pl-64 pt-14 pb-28 lg:pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 lg:py-8 flex flex-col gap-6">

            <div className="flex items-center gap-3">
              <button type="button" onClick={() => router.back()}
                className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs font-medium cursor-pointer transition-colors duration-200">
                <ArrowLeftIcon /> Voltar
              </button>
            </div>

            <div>
              <h1 className="font-display font-bold text-xl text-white">Notificações</h1>
              <p className="text-slate-500 text-sm mt-1">Alertas do seu estoque</p>
            </div>

            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <svg className="animate-spin w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-slate-600"
                  style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <BellIcon />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium text-sm">Tudo certo!</p>
                  <p className="text-slate-600 text-xs mt-1">Nenhum alerta de estoque no momento</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">

                {zerados.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium">Zerados ({zerados.length})</p>
                    {zerados.map((p) => (
                      <button key={p.id} type="button" onClick={() => router.push(`/estoque/${p.id}`)}
                        className="group w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                        style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}
                      >
                        <span className="text-red-400"><AlertIcon /></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                          <p className="text-xs text-red-400 mt-0.5">Estoque zerado</p>
                        </div>
                        <span className="font-display font-bold text-base text-red-400">{p.qty}</span>
                      </button>
                    ))}
                  </div>
                )}

                {baixos.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium">Estoque baixo ({baixos.length})</p>
                    {baixos.map((p) => (
                      <button key={p.id} type="button" onClick={() => router.push(`/estoque/${p.id}`)}
                        className="group w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                        style={{ background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.2)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(217,119,6,0.4)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(217,119,6,0.2)"; }}
                      >
                        <span className="text-amber-400"><BoxIcon /></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                          <p className="text-xs text-amber-400 mt-0.5">Mínimo: {p.min_qty} · Atual: {p.qty}</p>
                        </div>
                        <span className="font-display font-bold text-base text-amber-400">{p.qty}</span>
                      </button>
                    ))}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
