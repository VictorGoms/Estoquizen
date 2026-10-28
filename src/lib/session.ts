/**
 * Sessão (pedido do João em 2026-10-28: o app deslogava toda hora, principalmente no celular, que
 * fecha as abas sozinho). Duas regras, escolhidas no login por "Manter conectado neste aparelho":
 * - marcado (padrão): continua conectado até INACTIVITY_MS sem usar o app, mesmo fechando o navegador;
 * - desmarcado (aparelho compartilhado, como o computador do caixa): a regra antiga. A sessão acaba
 *   ao fechar o navegador (marca no sessionStorage) ou após INACTIVITY_CURTA_MS sem uso.
 */

export const INACTIVITY_MS       = 30 * 24 * 60 * 60 * 1000; // 30 dias
export const INACTIVITY_CURTA_MS = 2 * 60 * 60 * 1000;       // 2 horas
const SESSION_KEY  = "estoquizen_session_active";
const ACTIVITY_KEY = "estoquizen_last_activity";
const MANTER_KEY   = "estoquizen_manter_conectado";

/** Called right after a successful login. Sem o parâmetro, vale a última escolha deste aparelho */
export function markSessionActive(manter = manterConectado()) {
  sessionStorage.setItem(SESSION_KEY, "1");
  localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
  lembrarEscolha(manter);
}

/** Guarda a escolha antes de sair para o Google (o /auth/callback a usa ao voltar) */
export function lembrarEscolha(manter: boolean) {
  localStorage.setItem(MANTER_KEY, manter ? "1" : "0");
}

/** Sem a marca (quem entrou antes desta mudança) conta como "manter conectado" */
export function manterConectado(): boolean {
  return localStorage.getItem(MANTER_KEY) !== "0";
}

/** A última atividade ainda vale? Regra pura, testada em session.test.ts */
export function atividadeValida(ultima: number, manter: boolean, agora = Date.now()): boolean {
  return ultima > 0 && agora - ultima < (manter ? INACTIVITY_MS : INACTIVITY_CURTA_MS);
}

/** Returns true if the browser session marker is present (same browser session) */
export function isBrowserSessionActive(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

/*
 * O sessionStorage é por aba: uma aba nova (link aberto em outra aba) não tem o marcador e
 * deslogava tudo. Antes de concluir que o navegador foi fechado, a aba nova pergunta às abas
 * abertas pelo BroadcastChannel; se alguma responder, a sessão continua.
 */
const CHANNEL = "estoquizen_session";

/** Aba nova: pergunta se há outra aba com a sessão ativa. */
export function askOtherTabs(timeoutMs = 400): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof BroadcastChannel === "undefined") { resolve(false); return; }
    const ch = new BroadcastChannel(CHANNEL);
    const timer = setTimeout(() => { ch.close(); resolve(false); }, timeoutMs);
    ch.onmessage = (e) => {
      if (e.data === "alive") { clearTimeout(timer); ch.close(); resolve(true); }
    };
    ch.postMessage("ping");
  });
}

/** Aba com sessão ativa: responde às abas novas. Retorna a função que para de responder. */
export function answerOtherTabs(): () => void {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const ch = new BroadcastChannel(CHANNEL);
  ch.onmessage = (e) => {
    if (e.data === "ping" && isBrowserSessionActive()) ch.postMessage("alive");
  };
  return () => ch.close();
}

/** Marca esta aba como parte da sessão já aberta (sem mexer no relógio de inatividade). */
export function joinBrowserSession() {
  sessionStorage.setItem(SESSION_KEY, "1");
}

/** Returns true if user was active within the inactivity window (30 dias ou 2 h, pela escolha) */
export function isActivityValid(): boolean {
  return atividadeValida(Number(localStorage.getItem(ACTIVITY_KEY) ?? "0"), manterConectado());
}

/** Update last-activity timestamp — called on every user interaction */
export function touchActivity() {
  localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
}

/** Clear all session data (call before signing out) */
export function clearSession() {
  /* Tudo da aba: marcador, perfil em cache, cadastro pendente e nota em revisão
     (antes só os dois primeiros saíam e o resto ficava para o próximo login) */
  sessionStorage.clear();
  localStorage.removeItem(ACTIVITY_KEY);
  localStorage.removeItem(MANTER_KEY);
}
