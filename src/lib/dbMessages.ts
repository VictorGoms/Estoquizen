/**
 * Erros das escritas diretas no Supabase (PostgREST e Storage) em português. Antes a tela
 * mostrava o texto original ("new row violates row-level security policy for table ...").
 * As triggers do banco já levantam mensagem em português: essas passam como estão.
 */
export function dbErrorPt(
  err: { message?: string; code?: string } | null | undefined,
  fallback = "Não foi possível salvar. Tente novamente.",
): string {
  const msg  = err?.message ?? "";
  const m    = msg.toLowerCase();
  const code = err?.code ?? "";

  if (code === "42501" || m.includes("row-level security") || m.includes("permission denied")) {
    /* 42501 também é o código das triggers (ex.: protect_workspace_owner), que já falam português */
    return m.includes("row-level security") || m.includes("permission denied") || !msg
      ? "Você não tem permissão para esta ação."
      : msg;
  }
  if (code === "PGRST116")                       return "Registro não encontrado.";
  if (code === "23505")                          return "Já existe um registro com esses dados.";
  if (code === "23503")                          return "Este registro está ligado a outro e não pode ser alterado.";
  if (["23502", "23514", "22P02", "22003"].includes(code)) return "Algum valor está inválido. Confira os campos.";
  if (m.includes("jwt expired") || m.includes("invalid jwt")) return "Sua sessão expirou. Entre novamente.";
  if (m.includes("exceeded the maximum") || m.includes("too large")) return "Arquivo grande demais.";
  if (m.includes("mime type") || m.includes("invalid file type"))    return "Formato de arquivo não aceito.";
  if (m.includes("failed to fetch") || m.includes("network"))        return "Sem conexão com o servidor. Verifique sua internet.";
  return fallback;
}
