"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  analyticsDisponivel, lerConsentimento, decidirCookies, iniciarAnalytics, identificar, esquecerPessoa,
  EVENTO_COOKIES, EVENTO_PREFERENCIAS,
} from "@/lib/analytics";

/*
 * Aviso de cookies + ligação do analytics com o login (EQZ-01, opção A da LGPD). Fica no layout de
 * todas as páginas. Aparece enquanto a pessoa não escolheu, e de novo por "Preferências de cookies"
 * (rodapé, Perfil, Privacidade). "Aceitar" e "Só o necessário" têm o mesmo peso, como pede a ANPD.
 */
export default function Analytics() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!analyticsDisponivel) return;
    iniciarAnalytics();
    if (lerConsentimento() === null) setAberto(true);

    const reabrir = () => setAberto(true);
    /* Aceitou agora com a sessão aberta: liga os eventos à pessoa */
    const mudou = () => {
      if (lerConsentimento() !== "aceito") return;
      supabase.auth.getSession().then(({ data }) => { if (data.session) identificar(data.session.user.id); });
    };
    window.addEventListener(EVENTO_PREFERENCIAS, reabrir);
    window.addEventListener(EVENTO_COOKIES, mudou);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (sessao?.user && (evento === "INITIAL_SESSION" || evento === "SIGNED_IN")) identificar(sessao.user.id);
      if (evento === "SIGNED_OUT") esquecerPessoa();
    });

    return () => {
      window.removeEventListener(EVENTO_PREFERENCIAS, reabrir);
      window.removeEventListener(EVENTO_COOKIES, mudou);
      subscription.unsubscribe();
    };
  }, []);

  if (!aberto) return null;

  function escolher(escolha: "aceito" | "recusado") {
    decidirCookies(escolha);
    setAberto(false);
  }

  return (
    <section
      aria-labelledby="cookies-titulo"
      className="fixed inset-x-3 bottom-3 sm:left-auto sm:right-4 sm:bottom-4 sm:w-[420px] z-[60] bg-surface-2 text-fg rounded-4xl p-5 shadow-lift flex flex-col gap-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
    >
      <h2 id="cookies-titulo" className="text-base font-black">Cookies</h2>
      <p className="text-sm font-semibold text-fg-soft leading-relaxed">
        Usamos os cookies necessários para o app funcionar. Com a sua permissão, usamos também cookies de análise para
        entender como o Estoquizen é usado e melhorar o app. Sem publicidade.{" "}
        <Link href="/privacidade#cookies" className="text-accent font-extrabold underline-offset-2 hover:underline">Saiba mais</Link>
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => escolher("recusado")}
          className="min-h-[48px] rounded-full bg-surface text-sm font-extrabold cursor-pointer hover:bg-white/10 transition-colors"
        >
          Só o necessário
        </button>
        <button
          type="button"
          onClick={() => escolher("aceito")}
          className="min-h-[48px] rounded-full bg-accent text-ink text-sm font-black cursor-pointer hover:brightness-110 transition-[filter]"
        >
          Aceitar
        </button>
      </div>
    </section>
  );
}
