import useSWR, { mutate } from "swr";
import { api } from "@/lib/api";

export interface Product {
  id:          string;
  workspace_id: string;
  name:        string;
  source_name: string | null;
  code:        string;
  unit:        string;
  price:       number;
  qty:         number;
  min_qty:     number;
  max_qty:     number | null;
  location:    string | null;
  supplier:    string | null;
  image_url:   string | null;
  nota_fiscal: string | null;
  created_at:  string;
  updated_at:  string;
}

const fetcher = (workspaceId: string) =>
  api.get<Product[]>(`/products?workspace_id=${workspaceId}`);

export function useProducts(workspaceId: string | undefined) {
  const { data, error, isLoading } = useSWR(
    workspaceId ? ["products", workspaceId] : null,
    ([, id]: [string, string]) => fetcher(id),
    {
      dedupingInterval: 2 * 60 * 1000, // dados repetidos em até 2min são servidos do cache
      revalidateOnFocus: false,          // não refaz o fetch ao trocar de aba
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
