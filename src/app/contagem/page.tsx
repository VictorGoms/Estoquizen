"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import ProductAvatar from "@/components/estoque/ProductAvatar";
import AccessDenied from "@/components/ui/AccessDenied";
import PageLoader from "@/components/ui/PageLoader";
import PlanUpsell from "@/components/ui/PlanUpsell";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { getWorkspace } from "@/hooks/useWorkspace";
import { useRole, can } from "@/hooks/useRole";
import { usePlan, planInfo } from "@/hooks/usePlan";
import { useProducts, mutateProducts } from "@/hooks/useProducts";
import { useForecast } from "@/hooks/useForecast";
import { useStockCounts, mutateStockCounts } from "@/hooks/useStockCounts";
import { formatQty, parseQtyInput } from "@/lib/stock";
import {
  classesABC, itensDoDia, confiabilidade, sequencia, diaBrasil, bateu, META_CONFIABILIDADE, ITENS_POR_DIA,
} from "@/lib/contagem";
import { CheckIcon, Spinner } from "@/components/ui/icons";

/*
 * Contagem do dia (EQZ-17, Growth e Pro). A pessoa conta sem ver o número do sistema (contagem às
 * cegas, para não "acertar" de olho); depois vê se bateu. Se não bateu, o estoque já fica certo.
 */

interface Resultado { esperado: number; contado: number; ajuste: number }

export default function ContagemPage() {
  const router = useRouter();
  const role   = useRole();
  const { plan, loading: planLoading } = usePlan();

  const [wsId, setWsId]         = useState<string | undefined>(undefined);
  const [wsName, setWsName]     = useState("");
  const [userName, setUserName] = useState("");
  const [now, setNow]           = useState(0);
  const [valores, setValores]   = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState<string | null>(null);
  const [erros, setErros]       = useState<Record<string, string>>({});
  const [resultados, setResultados] = useState<Record<string, Resultado>>({});

  const liberado = !!planInfo(plan)?.contagemDoDia; /* Growth e Pro */
  const { products, loading: productsLoading } = useProducts(wsId);
  const forecast = useForecast(wsId);
  const { contagens, loading: countsLoading } = useStockCounts(wsId, liberado);

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

  const itens = useMemo(() => {
    if (!now) return [];
    return itensDoDia(products, classesABC(products, forecast), contagens, now);
  }, [products, forecast, contagens, now]);

  /* Contadas hoje (inclui as que a pessoa acabou de mandar) */
  const hoje = now ? diaBrasil(now) : "";
  const contadaHoje = (id: string) =>
    !!resultados[id] || contagens.some((c) => c.product_id === id && diaBrasil(new Date(c.created_at).getTime()) === hoje);
  const feitos = itens.filter((p) => contadaHoje(p.id)).length;

  const pct = now ? confiabilidade(contagens, now) : null;
  const seq = now ? sequencia(contagens, now) : 0;

  async function confirmar(id: string) {
    const n = parseQtyInput(valores[id] ?? "");
    if (Number.isNaN(n) || n < 0 || (valores[id] ?? "").trim() === "") {
      setErros({ ...erros, [id]: "Digite quantos tem (use vírgula para decimais)." });
      return;
    }
    setEnviando(id);
    setErros({ ...erros, [id]: "" });
    try {
      const r = await api.post<Resultado>(`/products/${id}/count`, { counted: n });
      setResultados({ ...resultados, [id]: r });
      if (wsId) { mutateStockCounts(wsId); if (r.ajuste !== 0) mutateProducts(wsId); }
    } catch (err) {
      setErros({ ...erros, [id]: err instanceof Error ? err.message : "Não foi possível registrar a contagem." });
    } finally {
      setEnviando(null);
    }
  }

  if (role === null || planLoading) return <PageLoader />;
  if (!can(role, "canMovimentar")) return <AccessDenied />;
  if (plan && !liberado) {
    return (
      <PlanUpsell
        title="A contagem do dia está no Growth e no Pro"
        desc="Todo dia o Estoquizen escolhe alguns produtos para você conferir em 2 minutos, e corrige o estoque quando não bate. É o jeito simples de manter o estoque certo."
      />
    );
  }

  const carregando = productsLoading || countsLoading || !now;

  return (
    <div className="min-h-screen bg-ink">
      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      <main className="lg:pl-64 pt-14 pb-28 lg:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5">

          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight leading-tight">Contagem do dia</h1>
            <p className="text-sm lg:text-[15px] font-bold text-fg-muted">
              Conte na prateleira e digite quantos tem. Leva uns 2 minutos e deixa o estoque certo.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <div className="bg-surface rounded-4xl p-4 flex flex-col gap-1">
              <dt className="text-[13px] font-extrabold text-fg-muted">Confiabilidade do estoque</dt>
              <dd className={`text-2xl font-black ${pct === null ? "" : pct >= META_CONFIABILIDADE ? "text-ok" : "text-low"}`}>
                {pct === null ? "—" : `${pct}%`}
              </dd>
              <dd className="text-xs font-bold text-fg-subtle">Contagens que bateram em 30 dias · meta {META_CONFIABILIDADE}%</dd>
            </div>
            <div className="bg-surface rounded-4xl p-4 flex flex-col gap-1">
              <dt className="text-[13px] font-extrabold text-fg-muted">Sequência</dt>
              <dd className="text-2xl font-black">{seq} {seq === 1 ? "dia" : "dias"}</dd>
              <dd className="text-xs font-bold text-fg-subtle">Dias seguidos contando</dd>
            </div>
          </dl>

          {carregando ? (
            <div className="flex flex-col gap-2.5">
              {[0, 1, 2].map((i) => <div key={i} className="h-[88px] rounded-[22px] bg-surface animate-pulse" />)}
            </div>
          ) : itens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-4 text-center bg-surface rounded-5xl px-6">
              <span className="w-16 h-16 rounded-full bg-ok/15 text-ok flex items-center justify-center">
                <CheckIcon className="w-8 h-8" strokeWidth={2.6} />
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-lg font-black">Nada para contar hoje</p>
                <p className="text-sm font-bold text-fg-muted">
                  {products.length === 0 ? "Cadastre produtos para começar." : "Todos os produtos foram conferidos há pouco. Volte amanhã."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-extrabold text-fg-soft">
                {feitos === itens.length ? "Contagem de hoje feita. Volte amanhã." : `${feitos} de ${itens.length} conferidos hoje`}
              </p>
              <ul className="flex flex-col gap-2.5">
                {itens.map((p) => {
                  const r = resultados[p.id];
                  const feito = contadaHoje(p.id);
                  return (
                    <li key={p.id} className="bg-surface rounded-[22px] p-3.5 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <ProductAvatar name={p.name} imageUrl={p.image_url} icon={p.icon} />
                        <div className="flex-1 min-w-0 flex flex-col">
                          <Link href={`/estoque/${p.id}`} className="text-[15px] font-extrabold leading-tight line-clamp-2 hover:underline underline-offset-2">{p.name}</Link>
                          <span className="text-[13px] font-bold text-fg-muted truncate">{p.location || p.code}</span>
                        </div>
                      </div>

                      {r ? (
                        <p className={`text-sm font-extrabold ${r.ajuste === 0 ? "text-ok" : "text-low"}`}>
                          {r.ajuste === 0
                            ? `Bateu: ${formatQty(r.contado)} ${p.unit}.`
                            : `Não bateu: o sistema tinha ${formatQty(r.esperado)} ${p.unit}. Estoque corrigido para ${formatQty(r.contado)} ${p.unit}.`}
                        </p>
                      ) : feito ? (
                        (() => {
                          const c = contagens.find((x) => x.product_id === p.id && diaBrasil(new Date(x.created_at).getTime()) === hoje)!;
                          return (
                            <p className={`text-sm font-extrabold ${bateu(c) ? "text-ok" : "text-low"}`}>
                              {bateu(c) ? "Conferido hoje: bateu." : `Conferido hoje: corrigido de ${formatQty(c.expected_qty)} para ${formatQty(c.counted_qty)} ${p.unit}.`}
                            </p>
                          );
                        })()
                      ) : (
                        <form
                          onSubmit={(e) => { e.preventDefault(); confirmar(p.id); }}
                          className="flex items-center gap-2"
                        >
                          <label htmlFor={`contagem-${p.id}`} className="text-[13px] font-bold text-fg-muted">Quantos tem?</label>
                          <input
                            id={`contagem-${p.id}`}
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={valores[p.id] ?? ""}
                            onChange={(e) => setValores({ ...valores, [p.id]: e.target.value })}
                            className="w-24 h-11 rounded-full bg-ink text-center text-[15px] font-black tabular-nums outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                          />
                          <span className="text-[13px] font-bold text-fg-muted">{p.unit}</span>
                          <button
                            type="submit"
                            disabled={enviando === p.id}
                            className="ml-auto min-h-[44px] px-5 rounded-full bg-accent text-ink text-sm font-black cursor-pointer hover:brightness-110 transition-[filter] disabled:opacity-60 flex items-center gap-2"
                          >
                            {enviando === p.id && <Spinner className="w-4 h-4" />}
                            Confirmar
                          </button>
                        </form>
                      )}
                      {erros[p.id] && <p role="alert" className="text-sm font-bold text-zero">{erros[p.id]}</p>}
                    </li>
                  );
                })}
              </ul>
              <p className="text-xs font-bold text-fg-subtle">
                Até {ITENS_POR_DIA} por dia. Os produtos que mais saem voltam toda semana; os outros, a cada 2 a 4 semanas.
              </p>
            </>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
