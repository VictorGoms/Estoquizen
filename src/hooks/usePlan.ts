"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import { getWorkspace } from "@/hooks/useWorkspace";

export type Plan = "basic" | "growth" | "pro";
export type PlanFeature = "nfe" | "metricas";

/**
 * Recursos de cada plano (SCRUM-57): o que a tela de planos promete. Os mesmos de
 * src/lib/plans.ts da API, que barra a importação de nota no Basic (as métricas são só no front).
 */
export const PLAN_FEATURES: Record<Plan, Record<PlanFeature, boolean>> = {
  basic:  { nfe: false, metricas: false },
  growth: { nfe: true,  metricas: true  },
  pro:    { nfe: true,  metricas: true  },
};

export function hasFeature(plan: Plan | null | undefined, feature: PlanFeature): boolean {
  return plan ? PLAN_FEATURES[plan]?.[feature] ?? false : false;
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
