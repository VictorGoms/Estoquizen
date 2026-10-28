"use client";

/*
 * CAPTCHA da Cloudflare Turnstile (EQZ-65, checklist de segurança de 2026-10-28) no login, no cadastro e
 * no "esqueci a senha", contra robôs e força bruta. Grátis, e o Supabase aceita em qualquer plano.
 *
 * Fica DESLIGADO enquanto não houver NEXT_PUBLIC_TURNSTILE_SITE_KEY (a chave pública do widget, criada
 * no painel da Cloudflare): sem ela não aparece nada e os formulários seguem sem token. Ordem para ligar:
 * 1) a chave na Vercel e o deploy do site; 2) a secret no Supabase, em Authentication → Bot and Abuse
 * Protection. Ligar no Supabase antes do site quebra o login.
 *
 * Cada token vale uma vez: depois de cada tentativa o formulário troca a `key` do componente para
 * gerar outro.
 */
import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export const captchaLigado = !!SITE_KEY;
export const MSG_CAPTCHA = "Espere a verificação de segurança terminar e tente de novo.";

interface Turnstile {
  render: (el: HTMLElement, opcoes: Record<string, unknown>) => string;
  remove: (id: string) => void;
}
declare global {
  interface Window { turnstile?: Turnstile }
}

let carregando: Promise<void> | null = null;

function carregarScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  carregando ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src   = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload  = () => resolve();
    s.onerror = () => { carregando = null; reject(new Error("Turnstile não carregou")); };
    document.head.appendChild(s);
  });
  return carregando;
}

export default function Captcha({ onToken }: { onToken: (token: string | null) => void }) {
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY || !caixa.current) return;
    let id: string | null = null;
    let vivo = true;
    carregarScript()
      .then(() => {
        if (!vivo || !caixa.current || !window.turnstile) return;
        id = window.turnstile.render(caixa.current, {
          sitekey:            SITE_KEY,
          language:           "pt-br",
          theme:              "dark",
          callback:           (token: string) => onToken(token),
          "expired-callback": () => onToken(null),
          "error-callback":   () => onToken(null),
        });
      })
      .catch(() => onToken(null));
    return () => {
      vivo = false;
      if (id && window.turnstile) window.turnstile.remove(id);
    };
  }, [onToken]);

  if (!SITE_KEY) return null;
  return <div ref={caixa} className="min-h-[65px] flex justify-center" />;
}
