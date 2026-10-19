import useSWR from "swr";
import { supabase } from "@/lib/supabase";

/** Data da última saída de cada produto (RPC stock_last_outflow, EQZ-18). Sem saída nunca: não aparece. */
export function useLastOutflow(workspaceId: string | undefined | null, enabled = true): Map<string, string> {
  const { data } = useSWR(
    workspaceId && enabled ? ["last-outflow", workspaceId] : null,
    async () => {
      const { data, error } = await supabase.rpc("stock_last_outflow", { p_workspace_id: workspaceId });
      if (error) throw error;
      return new Map((data as { product_id: string; ultima_saida: string }[]).map((r) => [r.product_id, r.ultima_saida]));
    },
    { dedupingInterval: 2 * 60 * 1000, revalidateOnFocus: false },
  );
  return data ?? VAZIO;
}

/* Mesma referência enquanto carrega ou quando o plano não tem o recurso */
const VAZIO = new Map<string, string>();
