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
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        markSessionActive();
        router.replace("/select-workspace");
      }
    });

    /* Força a troca do code pelo token — necessário no PKCE flow */
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        markSessionActive();
        router.replace("/select-workspace");
      }
    });
  }, [router]);

  return <PageLoader />;
}
