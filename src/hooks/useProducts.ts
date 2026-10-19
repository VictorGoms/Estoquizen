import useSWR, { mutate } from "swr";
import { supabase } from "@/lib/supabase";

export interface Product {
  id:           string;
  workspace_id: string;
  name:         string;
  source_name:  string | null;
  code:         string;
  unit:         string;
  price:        number;
  qty:          number;
  min_qty:      number;
  max_qty:      number | null;
  location:     string | null;
  supplier:     string | null;
  image_url:    string | null;
  nota_fiscal:  string | null;
  created_at:   string;
  updated_at:   string;
}

const PAGE = 1000; /* o PostgREST devolve no máximo 1000 linhas; o Pro vai até 2000 produtos */

const fetcher = async (workspaceId: string): Promise<Product[]> => {
  const all: Product[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("products")
      .select("id, workspace_id, name, source_name, code, unit, price, qty, min_qty, max_qty, location, supplier, image_url, nota_fiscal, created_at, updated_at")
      .eq("workspace_id", workspaceId)
      .order("name")
      .order("id")
      .range(from, from + PAGE - 1);

    if (error) throw new Error(error.message);
    all.push(...(data ?? []).map((p) => ({ ...p, price: Number(p.price) })));
    if (!data || data.length < PAGE) return all;
  }
};

export function useProducts(workspaceId: string | undefined) {
  const { data, error, isLoading } = useSWR(
    workspaceId ? ["products", workspaceId] : null,
    ([, id]: [string, string]) => fetcher(id),
    {
      dedupingInterval: 2 * 60 * 1000,
      revalidateOnFocus: false,
    }
  );

  return {
    products: data ?? [],
    loading:  isLoading,
    error:    error as Error | undefined,
  };
}

/** Invalida o cache de produtos — chamar após criar, deletar ou ajustar estoque */
export function mutateProducts(workspaceId: string) {
  mutate(["product-count", workspaceId]);
  mutate(["forecast", workspaceId]); /* a previsão muda com cada entrada/saída */
  mutate(["last-outflow", workspaceId]);
  return mutate(["products", workspaceId]);
}
