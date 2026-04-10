"use client";

import { useState, useEffect } from "react";
import { getWorkspace, type WorkspaceRole } from "./useWorkspace";

export type { WorkspaceRole };

/** Permissões por role */
export const PERMISSIONS = {
  owner: {
    canAccessNota:          true,
    canAccessConfiguracoes: true,
    canEncerrarAssinatura:  true,
    canEditEstoque:         true,
    canAddMembro:           true,
    canEditMembro:          true,
    canEditOwnerRole:       true,
  },
  admin: {
    canAccessNota:          true,
    canAccessConfiguracoes: true,
    canEncerrarAssinatura:  false,
    canEditEstoque:         true,
    canAddMembro:           true,
    canEditMembro:          true,
    canEditOwnerRole:       false,
  },
  member: {
    canAccessNota:          false,
    canAccessConfiguracoes: false,
    canEncerrarAssinatura:  false,
    canEditEstoque:         false,
    canAddMembro:           false,
    canEditMembro:          false,
    canEditOwnerRole:       false,
  },
} satisfies Record<WorkspaceRole, Record<string, boolean>>;

export type Permission = keyof (typeof PERMISSIONS)[WorkspaceRole];

/**
 * Retorna a role do usuário no workspace ativo (lida do localStorage).
 * Retorna null enquanto ainda está carregando (SSR safe).
 */
export function useRole(): WorkspaceRole | null {
  const [role, setRole] = useState<WorkspaceRole | null>(null);

  useEffect(() => {
    const ws = getWorkspace();
    setRole(ws?.role ?? null);
  }, []);

  return role;
}

/** Retorna true se o usuário tem a permissão dada. */
export function can(role: WorkspaceRole | null, permission: Permission): boolean {
  if (!role) return false;
  return PERMISSIONS[role][permission];
}
