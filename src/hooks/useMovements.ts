import useSWR, { mutate } from "swr";
import { supabase } from "@/lib/supabase";

export interface Movement {
  id:         string;
  delta:      number;
  reason:     string | null;
  created_at: string;
  created_by: string | null;
  product:    { id: string; name: string; unit: string };
}

interface MovementRow {
  id: string;
  delta: number | string;
  reason: string | null;
  created_at: string;
  created_by: string | null;
  products: { id: string; name: string; unit: string } | { id: string; name: string; unit: string }[] | null;
}

/** Movimentações do workspace nos últimos `days` dias, mais recentes primeiro (RLS filtra por membro). */
const fetcher = async (workspaceId: string, days: number): Promise<Movement[]> => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("movements")
    .select("id, delta, reason, created_at, created_by, products!inner(id, name, unit, workspace_id)")
    .eq("products.workspace_id", workspaceId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) throw new Error(error.message);

  return ((data ?? []) as MovementRow[]).map((m) => {
    const p = Array.isArray(m.products) ? m.products[0] : m.products;
    return {
      id:         m.id,
      delta:      Number(m.delta),
      reason:     m.reason,
      created_at: m.created_at,
      created_by: m.created_by,
      product:    { id: p?.id ?? "", name: p?.name ?? "Produto removido", unit: p?.unit ?? "" },
    };
  });
};

export function useMovements(workspaceId: string | undefined, days: number) {
  const { data, error, isLoading } = useSWR(
    workspaceId ? ["movements", workspaceId, days] : null,
    ([, id, d]: [string, string, number]) => fetcher(id, d),
    { dedupingInterval: 30 * 1000, revalidateOnFocus: false }
  );

  return {
    movements: data ?? [],
    loading:   isLoading,
    error:     error as Error | undefined,
  };
}

/** Invalida todas as janelas de movimentações do workspace — chamar após entrada/saída */
export function mutateMovements(workspaceId: string) {
  return mutate((key) => Array.isArray(key) && key[0] === "movements" && key[1] === workspaceId);
}

export type ProductMovement = Omit<Movement, "product">;

/** Últimas movimentações de um produto (página de detalhe). */
export function useProductMovements(productId: string | undefined, limit = 10) {
  const { data, error, isLoading } = useSWR(
    productId ? ["product-movements", productId, limit] : null,
    async ([, id, n]: [string, string, number]): Promise<ProductMovement[]> => {
      const { data: rows, error: err } = await supabase
        .from("movements")
        .select("id, delta, reason, created_at, created_by")
        .eq("product_id", id)
        .order("created_at", { ascending: false })
        .limit(n);
      if (err) throw new Error(err.message);
      return (rows ?? []).map((m) => ({ ...m, delta: Number(m.delta) }));
    },
    { revalidateOnFocus: false }
  );

  return {
    movements: data ?? [],
    loading:   isLoading,
    error:     error as Error | undefined,
  };
}

export function mutateProductMovements(productId: string) {
  return mutate((key) => Array.isArray(key) && key[0] === "product-movements" && key[1] === productId);
}
