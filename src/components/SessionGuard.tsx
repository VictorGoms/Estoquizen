"use client";

/**
 * SessionGuard — wrap every protected page with this.
 * On mount: checks if the session is still valid (inactivity; browser session só sem "Manter conectado").
 * In background: listens for user activity to keep the session alive.
 * Signs out and redirects to /login when either check fails.
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  isBrowserSessionActive,
  isActivityValid,
  touchActivity,
  clearSession,
  askOtherTabs,
  answerOtherTabs,
  joinBrowserSession,
  manterConectado,
} from "@/lib/session";

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"] as const;
// Check inactivity every minute
const CHECK_INTERVAL_MS = 60 * 1000;

export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function forceSignOut() {
    clearSession();
    /* "local": encerra só neste navegador. O padrão (global) derrubava também o celular. */
    await supabase.auth.signOut({ scope: "local" });
    router.replace("/login");
  }

  useEffect(() => {
    let cancelled = false;
    let stopAnswering = () => {};

    function handleActivity() {
      touchActivity();
    }

    async function start() {
      // ── 1. Sessão do navegador: só para quem desmarcou "Manter conectado" (aparelho
      //       compartilhado). Aba nova pergunta às outras antes de sair ──
      if (!isBrowserSessionActive()) {
        if (!manterConectado()) {
          const alive = await askOtherTabs();
          if (cancelled) return;
          if (!alive) {
            // Nenhuma aba aberta respondeu: o navegador foi fechado
            forceSignOut();
            return;
          }
        }
        joinBrowserSession();
      }

      if (!isActivityValid()) {
        // User was inactive for too long
        forceSignOut();
        return;
      }

      stopAnswering = answerOtherTabs();

      // ── 2. Activity listeners — reset the inactivity clock ───────────────
      ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

      // ── 3. Periodic inactivity check ─────────────────────────────────────
      intervalRef.current = setInterval(() => {
        if (!isActivityValid()) {
          forceSignOut();
        }
      }, CHECK_INTERVAL_MS);
    }

    start();

    return () => {
      cancelled = true;
      stopAnswering();
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, handleActivity));
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
