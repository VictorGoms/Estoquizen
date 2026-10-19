"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import AccessDenied from "@/components/ui/AccessDenied";
import PageLoader from "@/components/ui/PageLoader";
import PlanUpsell from "@/components/ui/PlanUpsell";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { getWorkspace } from "@/hooks/useWorkspace";
import { useRole, can } from "@/hooks/useRole";
import { usePlan, planInfo } from "@/hooks/usePlan";
import { formatQty, personInitials, tituloMovimentacao } from "@/lib/stock";
import { InIcon, OutIcon } from "@/components/ui/icons";

/*
 * Histórico por funcionário (EQZ-22, plano Pro): quem deu cada entrada e saída, com filtro por
 * pessoa, tipo e período. O dado já existia (movements.created_by); aqui só ganha a tela.
 */

const PERIODOS = [
  { dias: 7,   label: "7 dias" },
  { dias: 30,  label: "30 dias" },
  { dias: 90,  label: "3 meses" },
  { dias: 365, label: "12 meses" },
];
const LIMITE = 1000; /* o PostgREST devolve no máximo 1000 linhas por consulta */

interface Mov {
  id:         string;
  delta:      number;
  reason:     string | null;
  motivo:     string | null;
  created_at: string;
  created_by: string | null;
  produto:    { id: string; name: string; unit: string };
}

interface MemberRow { user_id: string; profiles: { name?: string | null; email?: string | null } | null }

type Tipo = "todos" | "entradas" | "saidas";

export default function HistoricoPage() {
  const router = useRouter();
  const role   = useRole();
  const { plan, loading: planLoading } = usePlan();

  const [wsId, setWsId]         = useState<string | null>(null);
  const [wsName, setWsName]     = useState("");
  const [userName, setUserName] = useState("");
  const [now, setNow]           = useState(0);
  const [dias, setDias]         = useState(30);
  const [pessoa, setPessoa]     = useState<string>("todos");
  const [tipo, setTipo]         = useState<Tipo>("todos");

  useEffect(() => {
    async function load() {
      const ws = getWorkspace();
      if (!ws) { router.push("/select-workspace"); return; }
      setWsId(ws.id);
      setWsName(ws.name);
      setNow(Date.now());
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
        setUserName(profile?.name ?? user.email?.split("@")[0] ?? "");
      }
    }
    load();
  }, [router]);

  const liberado = !!planInfo(plan)?.historicoPorPessoa;

  const { data: nomes } = useSWR(wsId && liberado ? ["historico-membros", wsId] : null, async () => {
    const rows = await api.get<MemberRow[]>(`/members?workspace_id=${wsId}`);
    return new Map(rows.map((m) => [m.user_id, m.profiles?.name || m.profiles?.email || "Sem nome"]));
  });

  const { data: movs, isLoading } = useSWR(wsId && liberado && now ? ["historico", wsId, dias] : null, async () => {
    const since = new Date(now - dias * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("movements")
      .select("id, delta, reason, motivo, created_at, created_by, products!inner(id, name, unit, workspace_id)")
      .eq("products.workspace_id", wsId!)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(LIMITE);
    if (error) throw error;
    type Row = Omit<Mov, "produto" | "delta"> & { delta: number | string; products: Mov["produto"] | Mov["produto"][] };
    return (data as unknown as Row[]).map((m) => ({
      ...m,
      delta:   Number(m.delta),
      produto: Array.isArray(m.products) ? m.products[0] : m.products,
    }));
  });

  /* "Ex-membro": quem fez a movimentação saiu do workspace. "…" enquanto os nomes carregam */
  const nomeDe = (id: string | null) => (!id ? "Sem autor" : !nomes ? "…" : nomes.get(id) ?? "Ex-membro");

  /* Resumo por pessoa no período (sem o filtro de pessoa, para comparar) */
  const resumo = useMemo(() => {
    const m = new Map<string, { entradas: number; saidas: number }>();
    for (const mv of movs ?? []) {
      const k = mv.created_by ?? "";
      const cur = m.get(k) ?? { entradas: 0, saidas: 0 };
      if (mv.delta > 0) cur.entradas++; else cur.saidas++;
      m.set(k, cur);
    }
    return [...m.entries()].sort((a, b) => (b[1].entradas + b[1].saidas) - (a[1].entradas + a[1].saidas));
  }, [movs]);

  const lista = (movs ?? []).filter((mv) =>
    (pessoa === "todos" || (mv.created_by ?? "") === pessoa) &&
    (tipo === "todos" || (tipo === "entradas" ? mv.delta > 0 : mv.delta < 0)));

  if (role === null || planLoading) return <PageLoader />;
  if (!can(role, "canEditEstoque")) return <AccessDenied />;
  if (plan && !liberado) {
    return (
      <PlanUpsell
        title="Histórico por funcionário está no plano Pro"
        desc="Veja quem deu cada entrada e saída e filtre por pessoa. O Estoquizen já guarda quem fez cada movimentação: ao mudar para o Pro, o histórico aparece completo."
      />
    );
  }

  const seg = (ativo: boolean) =>
    `min-h-[40px] px-4 rounded-full text-[13px] cursor-pointer transition-colors duration-200 ${ativo ? "bg-inverse text-ink font-black" : "text-fg-muted font-extrabold hover:text-fg"}`;

  return (
    <div className="min-h-screen bg-ink">
      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      <main className="lg:pl-64 pt-14 pb-28 lg:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5">

          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight leading-tight">Histórico</h1>
            <p className="text-sm lg:text-[15px] font-bold text-fg-muted">Quem deu cada entrada e saída, e quando.</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
            <div role="group" aria-label="Período" className="flex gap-1 p-1 rounded-full bg-surface self-start max-w-full overflow-x-auto">
              {PERIODOS.map((p) => (
                <button key={p.dias} type="button" aria-pressed={dias === p.dias} onClick={() => setDias(p.dias)} className={seg(dias === p.dias)}>
                  {p.label}
                </button>
              ))}
            </div>
            <div role="group" aria-label="Tipo" className="flex gap-1 p-1 rounded-full bg-surface self-start">
              {([["todos", "Tudo"], ["entradas", "Entradas"], ["saidas", "Saídas"]] as [Tipo, string][]).map(([t, label]) => (
                <button key={t} type="button" aria-pressed={tipo === t} onClick={() => setTipo(t)} className={seg(tipo === t)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Resumo por pessoa: tocar filtra a lista */}
          {resumo.length > 0 && (
            <section aria-label="Por pessoa" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {resumo.map(([id, r]) => {
                const ativo = pessoa === id;
                const nome  = nomeDe(id || null);
                return (
                  <button
                    key={id || "sem-autor"}
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => setPessoa(ativo ? "todos" : id)}
                    className={`flex items-center gap-3 p-3 rounded-[22px] text-left cursor-pointer transition-colors ${ativo ? "bg-inverse text-ink" : "bg-surface hover:bg-[#19243a]"}`}
                  >
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${ativo ? "bg-ink text-fg" : "bg-surface-2"}`}>
                      {personInitials(nome)}
                    </span>
                    <span className="min-w-0 flex flex-col">
                      <span className="text-[15px] font-extrabold truncate">{nome}</span>
                      <span className={`text-[13px] font-bold ${ativo ? "text-inverse-muted" : "text-fg-muted"}`}>
                        {r.entradas} {r.entradas === 1 ? "entrada" : "entradas"} · {r.saidas} {r.saidas === 1 ? "saída" : "saídas"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </section>
          )}

          <section aria-label="Movimentações" className="bg-surface rounded-5xl p-4 lg:p-5 flex flex-col">
            {isLoading || !movs ? (
              <div className="flex flex-col gap-2">
                {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 rounded-2xl bg-surface-2 animate-pulse" />)}
              </div>
            ) : lista.length === 0 ? (
              <p className="py-6 text-center text-sm font-bold text-fg-muted">Nenhuma movimentação com esses filtros.</p>
            ) : (
              <ul className="flex flex-col">
                {lista.map((mv) => {
                  const entrada = mv.delta > 0;
                  return (
                    <li key={mv.id} className="flex items-center gap-3 py-3 border-t-2 border-dashed border-white/6 first:border-t-0">
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${entrada ? "bg-ok/15 text-ok" : "bg-low/15 text-low"}`}>
                        {entrada ? <InIcon className="w-4 h-4" /> : <OutIcon className="w-4 h-4" />}
                      </span>
                      <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <Link href={`/estoque/${mv.produto.id}`} className="text-[15px] font-extrabold truncate hover:underline underline-offset-2">
                          {mv.produto.name}
                        </Link>
                        <span className="text-[13px] font-bold text-fg-muted truncate">
                          {nomeDe(mv.created_by)} · {new Date(mv.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          {mv.motivo || mv.reason ? ` · ${tituloMovimentacao(mv)}` : ""}
                        </span>
                      </span>
                      <span className={`text-[15px] font-black tabular-nums shrink-0 ${entrada ? "text-ok" : "text-fg"}`}>
                        {entrada ? "+" : "−"}{formatQty(Math.abs(mv.delta))} <span className="text-[13px] font-bold text-fg-muted">{mv.produto.unit}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {movs && movs.length >= LIMITE && (
              <p className="pt-3 text-[13px] font-bold text-fg-subtle">Mostrando as {LIMITE} movimentações mais recentes do período. Diminua o período para ver o resto.</p>
            )}
          </section>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
