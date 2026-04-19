"use client";

export const dynamic = "force-dynamic";

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

    const code = new URLSearchParams(window.location.search).get("code");

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(async ({ data, error }) => {
        if (error) { router.replace("/login"); return; }
        const session = data.session ?? (await supabase.auth.getSession()).data.session;
        if (!session) { router.replace("/login"); return; }
        redirect(session);
      });
      return;
    }

    // Fluxo sem code (OAuth via hash fragment)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
