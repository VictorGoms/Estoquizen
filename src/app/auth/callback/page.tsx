"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageLoader from "@/components/ui/PageLoader";
import { markSessionActive } from "@/lib/session";

/**
 * Supabase redireciona aqui após OAuth (Google, etc.).
 * Troca o `code` da URL por uma sessão real e segue para o app.
 */
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

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        router.replace("/reset-password");
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        redirect(session);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      // Se a URL contém type=recovery, deixa o onAuthStateChange tratar
      if (window.location.hash.includes("type=recovery")) return;
      redirect(data.session);
    });
  }, [router]);

  return <PageLoader />;
}
