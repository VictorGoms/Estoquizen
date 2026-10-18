/** Tamanho mínimo de senha em todas as telas (o cadastro já pedia 8; as outras aceitavam 6). */
export const MIN_PASSWORD = 8;

/**
 * Mensagens do Supabase Auth em português. Antes algumas telas mostravam o texto original
 * ("Password should be at least 6 characters.").
 */
export function authErrorPt(message: string | null | undefined): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Este e-mail já tem cadastro. Entre ou recupere a senha.";
  }
  if (m.includes("password should be at least")) return `A senha deve ter pelo menos ${MIN_PASSWORD} caracteres.`;
  if (m.includes("weak") || m.includes("pwned") || m.includes("leaked")) {
    return "Essa senha é fraca ou já apareceu em vazamentos. Escolha outra.";
  }
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed"))       return "E-mail não confirmado. Verifique sua caixa de entrada.";
  if (m.includes("rate limit") || m.includes("you can only request this after")) {
    return "Muitas tentativas. Aguarde um minuto e tente de novo.";
  }
  if (m.includes("different from the old") || m.includes("same password")) {
    return "A nova senha precisa ser diferente da atual.";
  }
  if (m.includes("invalid email") || m.includes("unable to validate email")) return "E-mail inválido.";
  if (m.includes("expired") || m.includes("invalid flow state") || m.includes("otp")) {
    return "Este link expirou ou já foi usado. Peça um novo.";
  }
  return "Não foi possível concluir. Tente novamente.";
}

/**
 * Quando o link do e-mail não vale mais (expirado ou já usado), o Supabase volta com
 * ?error=...&error_code=otp_expired (ou no #hash). Retorna a mensagem para mostrar, ou null.
 */
export function readAuthLinkError(): string | null {
  const q = new URLSearchParams(window.location.search);
  const h = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const code = q.get("error_code") ?? h.get("error_code");
  const err  = q.get("error") ?? h.get("error");
  if (!code && !err) return null;
  return code === "otp_expired"
    ? "Este link expirou ou já foi usado. Peça um novo."
    : "Não foi possível validar o link. Peça um novo.";
}
