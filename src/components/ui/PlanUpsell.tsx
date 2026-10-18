"use client";

import Link from "next/link";
import { useRole, can } from "@/hooks/useRole";

/** Recurso além do plano atual (EQZ-27): explica e leva o dono para trocar de plano. */
export default function PlanUpsell({ title, desc }: { title: string; desc: string }) {
  const canUpgrade = can(useRole(), "canGerenciarAssinatura");

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="w-16 h-16 rounded-full bg-surface text-accent flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </span>
      <div className="flex flex-col gap-1.5 max-w-md">
        <h1 className="text-2xl font-black">{title}</h1>
        <p className="text-[15px] font-bold text-fg-muted leading-relaxed">{desc}</p>
        {!canUpgrade && (
          <p className="text-sm font-bold text-fg-subtle mt-1">Fale com o dono do workspace para mudar de plano.</p>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-2.5">
        {canUpgrade && (
          <Link href="/configuracoes" className="min-h-[48px] flex items-center justify-center px-6 rounded-full bg-accent text-ink text-[15px] font-black hover:brightness-110 transition-[filter]">
            Ver planos
          </Link>
        )}
        <Link href="/dashboard" className="min-h-[48px] flex items-center justify-center px-6 rounded-full bg-surface text-[15px] font-extrabold hover:bg-surface-2 transition-colors">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
