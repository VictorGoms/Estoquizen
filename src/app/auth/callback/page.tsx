"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageLoader from "@/components/ui/PageLoader";
import { markSessionActive } from "@/lib/session";
import { readAuthLinkError } from "@/lib/authMessages";
import { registrar } from "@/lib/analytics";
import { workspaceDoLink } from "@/lib/convite";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    function redirect(session: { user?: { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown>; created_at?: string } } | null) {
      if (!session) return;
      markSessionActive();
      /* Conta nova pelo Google (criada agora há pouco): começo do funil (EQZ-01). O cadastro por
         e-mail já conta na tela de cadastro */
      const criadaEm = session.user?.created_at ? new Date(session.user.created_at).getTime() : 0;
      if (session.user?.app_metadata?.provider === "google" && Date.now() - criadaEm < 10 * 60_000) {
        registrar("cadastro_criado", { metodo: "google" });
      }
      if (session.user?.user_metadata?.from_invite) {
        /* O link do convite diz qual workspace aceitar (EQZ-56); o metadata pode ter sido
           reescrito pelo convite de outra empresa */
        const ws = workspaceDoLink(window.location.search);
        router.replace(ws ? `/set-password?workspace_id=${ws}` : "/set-password");
      } else {
        router.replace("/select-workspace");
      }
    }

    /* Link expirado ou já usado: o login explica, em vez de só reaparecer */
    if (readAuthLinkError()) { router.replace("/login?link=expirado"); return; }

    const code = new URLSearchParams(window.location.search).get("code");

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(async ({ data, error }) => {
        if (error) { router.replace("/login?link=expirado"); return; }
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
