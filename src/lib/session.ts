/**
 * Session management — two layers:
 * 1. sessionStorage marker: cleared automatically when browser/tab closes
 * 2. Inactivity timeout: signs out after INACTIVITY_MS of no user interaction
 */

export const INACTIVITY_MS = 2 * 60 * 60 * 1000; // 2 hours
const SESSION_KEY  = "estoquizen_session_active";
const ACTIVITY_KEY = "estoquizen_last_activity";

/** Called right after a successful login */
export function markSessionActive() {
  sessionStorage.setItem(SESSION_KEY, "1");
  localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
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

/** Returns true if user was active within the inactivity window */
export function isActivityValid(): boolean {
  const last = Number(localStorage.getItem(ACTIVITY_KEY) ?? "0");
  return last > 0 && Date.now() - last < INACTIVITY_MS;
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
}
