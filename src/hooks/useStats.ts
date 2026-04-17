import useSWR, { mutate } from "swr";
import { api } from "@/lib/api";

export interface WorkspaceStats {
  produtos:       number;
  alertas:        number;
  movimentacoes:  number;
}

const fetcher = (workspaceId: string) =>
  api.get<WorkspaceStats>(`/workspaces/${workspaceId}/stats`);

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
