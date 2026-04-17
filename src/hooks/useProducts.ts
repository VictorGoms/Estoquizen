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

const fetcher = async (workspaceId: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("id, workspace_id, name, source_name, code, unit, price, qty, min_qty, max_qty, location, supplier, image_url, nota_fiscal, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({ ...p, price: Number(p.price) }));
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
  return mutate(["products", workspaceId]);
}
