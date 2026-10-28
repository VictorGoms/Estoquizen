/*
 * Senha vazada (EQZ-65, checklist de segurança de 2026-10-28). O bloqueio nativo do Supabase só existe
 * no plano Pro; até lá, o cadastro e as telas de senha consultam a lista pública do HaveIBeenPwned por
 * k-anonimato: só os 5 primeiros caracteres do SHA-1 da senha saem do navegador, e a comparação do
 * resto acontece aqui. Se a consulta falhar (sem internet, serviço fora), não bloqueia: o Supabase
 * continua exigindo 8 caracteres. Quando o Pro entrar, a proteção dele substitui esta.
 */
export const MSG_SENHA_VAZADA = "Essa senha já apareceu em vazamentos de dados na internet. Escolha outra.";

/** SHA-1 em hexadecimal maiúsculo, como a API do HaveIBeenPwned usa */
export async function sha1Hex(texto: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(texto));
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** A resposta da API (linhas "SUFIXO:QUANTIDADE") tem o sufixo com quantidade maior que zero? */
export function apareceNaLista(resposta: string, sufixo: string): boolean {
  const alvo = sufixo.toUpperCase();
  return resposta.split("\n").some((linha) => {
    const [s, n] = linha.trim().split(":");
    return s === alvo && Number(n) > 0;   // o padding ("Add-Padding") vem com quantidade 0
  });
}

export async function senhaVazada(senha: string): Promise<boolean> {
  try {
    const hash = await sha1Hex(senha);
    const res  = await fetch(`https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`, {
      headers: { "Add-Padding": "true" },
    });
    if (!res.ok) return false;
    return apareceNaLista(await res.text(), hash.slice(5));
  } catch {
    return false;
  }
}
