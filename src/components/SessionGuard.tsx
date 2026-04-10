"use client";

/**
 * SessionGuard — wrap every protected page with this.
 * On mount: checks if the session is still valid (browser session + inactivity).
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
  INACTIVITY_MS,
} from "@/lib/session";

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"] as const;
// Check inactivity every minute
const CHECK_INTERVAL_MS = 60 * 1000;

export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function forceSignOut() {
    clearSession();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  useEffect(() => {
    // ── 1. On mount: verify both session layers ──────────────────────────
    if (!isBrowserSessionActive()) {
      // Browser was closed or tab was fresh-opened — end the Supabase session
      forceSignOut();
      return;
    }

    if (!isActivityValid()) {
      // User was inactive for too long
      forceSignOut();
      return;
    }

    // ── 2. Activity listeners — reset the inactivity clock ───────────────
    function handleActivity() {
      touchActivity();
    }

    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    // ── 3. Periodic inactivity check ─────────────────────────────────────
    intervalRef.current = setInterval(() => {
      if (!isActivityValid()) {
        forceSignOut();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, handleActivity));
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
