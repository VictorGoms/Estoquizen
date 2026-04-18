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
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem("estoquizen_user_profile");
  localStorage.removeItem(ACTIVITY_KEY);
}
