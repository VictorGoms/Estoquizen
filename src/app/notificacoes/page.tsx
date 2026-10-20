"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import ProductAvatar from "@/components/estoque/ProductAvatar";
import StatusChip from "@/components/estoque/StatusChip";
import LevelBar from "@/components/estoque/LevelBar";
import { supabase } from "@/lib/supabase";
import { getWorkspace } from "@/hooks/useWorkspace";
import { formatQty, previsaoDias, formatPrevisao, type StockStatus } from "@/lib/stock";
import { useForecast } from "@/hooks/useForecast";
import { BellIcon, CheckIcon } from "@/components/ui/icons";

interface AlertProduct {
  id: string;
  name: string;
  qty: number;
  min_qty: number;
  unit: string;
  location: string | null;
  image_url: string | null;
  icon: string | null;
  created_at: string;
}

function AlertRow({ p, status, previsao }: { p: AlertProduct; status: StockStatus; previsao: number | null }) {
  return (
    <li>
      <Link href={`/estoque/${p.id}`} className="flex items-center gap-3.5 p-3 pr-4 rounded-[22px] bg-surface hover:bg-[#19243a] transition-colors">
        <ProductAvatar name={p.name} imageUrl={p.image_url} icon={p.icon} />
        <span className="flex-1 min-w-0 flex flex-col gap-1.5">
          <span className="flex justify-between items-center gap-2">
            <span className="text-[15px] font-extrabold truncate">{p.name}</span>
            <StatusChip status={status} size="sm" />
          </span>
          <LevelBar fill={p.min_qty ? Math.min(p.qty / p.min_qty, 1) : 0} status={status} />
          <span className="text-[13px] font-bold text-fg-muted truncate">
            {formatQty(p.qty)} de {formatQty(p.min_qty)} {p.unit} mínimo
            {previsao !== null ? ` · ${formatPrevisao(previsao)}` : p.location ? ` · ${p.location}` : ""}
          </span>
        </span>
      </Link>
    </li>
  );
}

export default function NotificacoesPage() {
  const router = useRouter();
  const [wsName, setWsName]         = useState("");
  const [userName, setUserName]     = useState("");
  const [alerts, setAlerts]         = useState<AlertProduct[]>([]);
  const [loading, setLoading]       = useState(true);
  const [wsId, setWsId]             = useState<string | null>(null);
  const [now, setNow]               = useState(0);
  const forecast                    = useForecast(wsId);

  useEffect(() => {
    async function load() {
      const ws = getWorkspace();
      if (!ws) { router.push("/select-workspace"); return; }
      setWsName(ws.name);
      setWsId(ws.id);
      setNow(Date.now());

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
        setUserName(profile?.name ?? user.email?.split("@")[0] ?? "");
      }

      const { data } = await supabase
        .from("products")
        .select("id, name, qty, min_qty, unit, location, image_url, icon, created_at")
        .eq("workspace_id", ws.id);

      const rows = (data ?? []).map((p) => ({ ...p, qty: Number(p.qty), min_qty: Number(p.min_qty ?? 0) }));
      setAlerts(rows.filter((p) => p.qty === 0 || p.qty <= p.min_qty) as AlertProduct[]);
      setLoading(false);
    }
    load();
  }, [router]);

  const zerados = alerts.filter((p) => p.qty === 0);
  const baixos  = alerts.filter((p) => p.qty > 0 && p.qty <= p.min_qty);

  return (
    <div className="min-h-screen bg-ink">
      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      <main className="lg:pl-64 pt-14 pb-28 lg:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-6">

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight leading-tight">Notificações</h1>
              {alerts.length > 0 && (
                <Link href="/compras" className="min-h-[44px] flex items-center px-5 rounded-full bg-accent text-ink text-sm font-black hover:brightness-110 transition-[filter]">
                  Montar lista de compras
                </Link>
              )}
            </div>
            <p className="text-sm lg:text-[15px] font-bold text-fg-muted">
              {loading ? "Carregando…" : alerts.length === 0 ? "Nenhum alerta agora" : `${alerts.length} produto${alerts.length !== 1 ? "s" : ""} precisa${alerts.length !== 1 ? "m" : ""} de atenção`}
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2.5">
              {[0, 1, 2].map((i) => <div key={i} className="h-[76px] rounded-[22px] bg-surface animate-pulse" />)}
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center bg-surface rounded-5xl">
              <span className="w-16 h-16 rounded-full bg-ok/15 text-ok flex items-center justify-center">
                <CheckIcon className="w-8 h-8" strokeWidth={2.6} />
              </span>
              <div>
                <p className="text-lg font-black">Tudo certo!</p>
                <p className="text-sm font-bold text-fg-muted mt-1">Nenhum produto está no mínimo ou zerado.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {zerados.length > 0 && (
                <section className="flex flex-col gap-3">
                  <h2 className="flex items-center gap-2 text-base font-black">
                    <span className="w-2.5 h-2.5 rounded-full bg-zero" aria-hidden="true" />
                    Zerados · {zerados.length}
                  </h2>
                  <ul className="flex flex-col gap-2.5">
                    {zerados.map((p) => <AlertRow key={p.id} p={p} status="zerado" previsao={null} />)}
                  </ul>
                </section>
              )}
              {baixos.length > 0 && (
                <section className="flex flex-col gap-3">
                  <h2 className="flex items-center gap-2 text-base font-black">
                    <span className="w-2.5 h-2.5 rounded-full bg-low" aria-hidden="true" />
                    Estoque baixo · {baixos.length}
                  </h2>
                  <ul className="flex flex-col gap-2.5">
                    {baixos.map((p) => <AlertRow key={p.id} p={p} status="baixo" previsao={previsaoDias(p.qty, p.created_at, forecast.get(p.id), now)} />)}
                  </ul>
                </section>
              )}
              <p className="flex items-center gap-2 text-[13px] font-bold text-fg-subtle">
                <BellIcon className="w-4 h-4" /> Um produto entra aqui quando a quantidade chega ao mínimo cadastrado.
              </p>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
