"use client";

import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import { usePlan, planInfo, PLAN_INFO } from "@/hooks/usePlan";

export interface ProductLimit {
  count:     number;
  limit:     number;
  label:     string;
  /** Chegou a 80% do limite (EQZ-06): o momento natural de mudar de plano */
  near:      boolean;
  /** Chegou ao limite: a API recusa novos cadastros */
  at:        boolean;
  /** Próximo plano e quantos produtos cabem nele (null no Pro) */
  nextLabel: string | null;
  nextLimit: number | null;
}

/** Produtos cadastrados × limite do plano do workspace. null enquanto carrega. */
export function useProductLimit(workspaceId: string | undefined | null): ProductLimit | null {
  const { plan } = usePlan();
  const { data: count } = useSWR(workspaceId ? ["product-count", workspaceId] : null, async () => {
    const { count, error } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId!);
    if (error) throw error;
    return count ?? 0;
  });

  const info = planInfo(plan);
  if (!info || count === undefined) return null;
  const next = info.proximo ? PLAN_INFO[info.proximo] : null;
  return {
    count,
    limit:     info.produtos,
    label:     info.label,
    near:      count >= Math.ceil(info.produtos * 0.8),
    at:        count >= info.produtos,
    nextLabel: next?.label ?? null,
    nextLimit: next?.produtos ?? null,
  };
}
