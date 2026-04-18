"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageLoader from "@/components/ui/PageLoader";
import { markSessionActive } from "@/lib/session";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    function redirect(session: { user?: { user_metadata?: Record<string, unknown> } } | null) {
      if (!session) return;
      markSessionActive();
      if (session.user?.user_metadata?.from_invite) {
        router.replace("/set-password");
      } else {
        router.replace("/select-workspace");
      }
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const isRecovery = params.get("type") === "recovery";

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) { router.replace("/login"); return; }
        if (isRecovery) {
          router.replace("/reset-password");
        } else {
          supabase.auth.getSession().then(({ data }) => redirect(data.session));
        }
      });
      return;
    }

    // Fluxo sem code (OAuth antigo / hash fragment)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        router.replace("/reset-password");
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        redirect(session);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) redirect(data.session);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return <PageLoader />;
}
