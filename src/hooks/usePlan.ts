"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import { getWorkspace } from "@/hooks/useWorkspace";

export type Plan = "basic" | "growth" | "pro";

/**
 * Recursos de cada plano, pelos planos fechados em 2026-10-17 (EQZ-27). Os mesmos de
 * src/lib/plans.ts da API, que confere a cota de notas (as métricas são aplicadas aqui).
 * notasPorMes: null = sem limite.
 */
export const PLAN_INFO: Record<Plan, { label: string; produtos: number; notasPorMes: number | null; metricasDias: number; membros: number | null; historicoPorPessoa: boolean; proximo: Plan | null }> = {
  basic:  { label: "Basic",  produtos: 50,   notasPorMes: 2,    metricasDias: 30,  membros: 3,    historicoPorPessoa: false, proximo: "growth" },
  growth: { label: "Growth", produtos: 300,  notasPorMes: null, metricasDias: 90,  membros: 10,   historicoPorPessoa: false, proximo: "pro"    },
  pro:    { label: "Pro",    produtos: 2000, notasPorMes: null, metricasDias: 365, membros: null, historicoPorPessoa: true,  proximo: null     },
};

export function planInfo(plan: Plan | null | undefined) {
  return plan ? PLAN_INFO[plan] ?? null : null;
}

/** Início do mês corrente no horário de Brasília (UTC-3), como a API e o banco contam. */
export function inicioDoMesBrasil(): string {
  const brt = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return new Date(Date.UTC(brt.getUTCFullYear(), brt.getUTCMonth(), 1, 3)).toISOString();
}

/** Plano do workspace ativo. `loading` até saber; se a consulta falhar, `plan` fica null. */
export function usePlan(): { plan: Plan | null; loading: boolean } {
  const [wsId, setWsId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setWsId(getWorkspace()?.id ?? null);
    setReady(true);
  }, []);

  const { data, error, isLoading } = useSWR(wsId ? ["workspace-plan", wsId] : null, async () => {
    const { data, error } = await supabase.from("workspaces").select("plan").eq("id", wsId!).single();
    if (error) throw error;
    return data.plan as Plan;
  });

  return { plan: error ? null : data ?? null, loading: !ready || isLoading };
}
