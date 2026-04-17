import useSWR, { mutate } from "swr";
import { supabase } from "@/lib/supabase";

export interface WorkspaceStats {
  produtos:       number;
  alertas:        number;
  movimentacoes:  number;
}

const fetcher = async (workspaceId: string): Promise<WorkspaceStats> => {
  const [produtosRes, alertasRes, movsRes] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).lt("qty", 10),
    supabase.from("movements").select("id, products!inner(workspace_id)", { count: "exact", head: true }).eq("products.workspace_id", workspaceId),
  ]);

  if (produtosRes.error) throw new Error(produtosRes.error.message);
  if (alertasRes.error)  throw new Error(alertasRes.error.message);

  return {
    produtos:      produtosRes.count  ?? 0,
    alertas:       alertasRes.count   ?? 0,
    movimentacoes: movsRes.count      ?? 0,
  };
};

export function useStats(workspaceId: string | undefined) {
  const { data, error, isLoading } = useSWR(
    workspaceId ? ["stats", workspaceId] : null,
    ([, id]: [string, string]) => fetcher(id),
    {
      dedupingInterval: 30 * 1000, // stats ficam no cache por 30s
      revalidateOnFocus: false,
    }
  );

  return {
    stats:   data,
    loading: isLoading,
    error:   error as Error | undefined,
  };
}

/** Invalida o cache de stats — chamar após entrada/saída de estoque */
export function mutateStats(workspaceId: string) {
  return mutate(["stats", workspaceId]);
}
