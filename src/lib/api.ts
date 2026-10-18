/**
 * Cliente HTTP para o Estoquizen API (Fastify em localhost:3001)
 * Injeta automaticamente o token do usuário logado.
 */

import { supabase } from "./supabase";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/* Mensagem quando a resposta não traz { error } (ex.: página HTML de erro do proxy) */
const STATUS_MESSAGES: Record<number, string> = {
  401: "Sua sessão expirou. Entre novamente.",
  403: "Você não tem permissão para esta ação.",
  404: "Não encontrado.",
  429: "Muitas requisições. Aguarde um momento e tente novamente.",
  502: "Servidor indisponível no momento. Tente novamente em instantes.",
  503: "Servidor indisponível no momento. Tente novamente em instantes.",
  504: "O servidor demorou para responder. Tente novamente.",
};

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getToken();

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error("Sem conexão com o servidor. Verifique a internet e tente novamente.");
  }

  /* res.json() direto quebrava com "Unexpected token <" quando vinha HTML, e com 204 (sem corpo) */
  const text = await res.text();
  let json: { data?: unknown; error?: string | null } | null = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* resposta não-JSON */ }

  if (!res.ok) {
    throw new Error(json?.error || STATUS_MESSAGES[res.status] || `Erro ${res.status}. Tente novamente.`);
  }
  return (json?.data ?? undefined) as T;
}

export const api = {
  get:    <T>(path: string)                  => request<T>("GET",    path),
  post:   <T>(path: string, body: unknown)   => request<T>("POST",   path, body),
  patch:  <T>(path: string, body: unknown)   => request<T>("PATCH",  path, body),
  delete: <T>(path: string)                  => request<T>("DELETE", path),
};
