import useSWR, { mutate } from "swr";
import { supabase } from "@/lib/supabase";

/**
 * Saídas dos últimos 30 dias por produto (RPC stock_forecast, EQZ-16). A previsão em si
 * (`previsaoDias` em lib/stock) junta isso com a quantidade e a data de cadastro.
 */
export function useForecast(workspaceId: string | undefined | null): Map<string, number> {
  const { data } = useSWR(
    workspaceId ? ["forecast", workspaceId] : null,
    async () => {
      const { data, error } = await supabase.rpc("stock_forecast", { p_workspace_id: workspaceId });
      if (error) throw error;
      return new Map((data as { product_id: string; saidas_30d: number | string }[])
        .map((r) => [r.product_id, Number(r.saidas_30d)]));
    },
    { dedupingInterval: 2 * 60 * 1000, revalidateOnFocus: false },
  );
  return data ?? new Map();
}

export function mutateForecast(workspaceId: string) {
  return mutate(["forecast", workspaceId]);
}
