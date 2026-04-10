"use client";

/**
 * Lê/grava o workspace ativo no localStorage.
 * Chave: "estoquizen_workspace" → { id, name }
 */

const KEY = "estoquizen_workspace";

export type WorkspaceRole = "owner" | "admin" | "member";

export interface ActiveWorkspace {
  id:   string;
  name: string;
  role: WorkspaceRole;
}

export function getWorkspace(): ActiveWorkspace | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ActiveWorkspace) : null;
  } catch {
    return null;
  }
}

export function setWorkspace(ws: ActiveWorkspace) {
  localStorage.setItem(KEY, JSON.stringify(ws));
}

export function clearWorkspace() {
  localStorage.removeItem(KEY);
}
