"use client";

import useSWR from "swr";
import { api } from "@/lib/api";

interface MemberRow { user_id: string; profiles: { name?: string | null; email?: string | null } | null }

/**
 * Nome de cada pessoa do workspace (user_id → nome), para mostrar quem fez cada movimentação.
 * A lista vem da API (/members), que qualquer membro pode ler. null enquanto carrega.
 */
export function useMemberNames(workspaceId: string | undefined | null): Map<string, string> | null {
  const { data } = useSWR(
    workspaceId ? ["member-names", workspaceId] : null,
    async () => {
      const rows = await api.get<MemberRow[]>(`/members?workspace_id=${workspaceId}`);
      return new Map(rows.map((m) => [m.user_id, m.profiles?.name || m.profiles?.email?.split("@")[0] || "Sem nome"]));
    },
    { revalidateOnFocus: false, dedupingInterval: 5 * 60 * 1000 },
  );
  return data ?? null;
}
