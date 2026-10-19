import useSWR, { mutate } from "swr";
import { supabase } from "@/lib/supabase";
import type { ContagemRow } from "@/lib/contagem";

/** Contagens dos últimos 90 dias do workspace (EQZ-17): base da escolha do dia, da sequência e da confiabilidade. */
export function useStockCounts(workspaceId: string | undefined | null, enabled = true) {
  const { data, isLoading } = useSWR(
    workspaceId && enabled ? ["stock-counts", workspaceId] : null,
    async () => {
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("stock_counts")
        .select("product_id, created_at, expected_qty, counted_qty")
        .eq("workspace_id", workspaceId!)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []).map((c) => ({ ...c, expected_qty: Number(c.expected_qty), counted_qty: Number(c.counted_qty) })) as ContagemRow[];
    },
    { revalidateOnFocus: false },
  );
  return { contagens: data ?? [], loading: isLoading };
}

export function mutateStockCounts(workspaceId: string) {
  return mutate(["stock-counts", workspaceId]);
}
