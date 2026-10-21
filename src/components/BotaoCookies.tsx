"use client";

import { abrirPreferenciasCookies, analyticsDisponivel } from "@/lib/analytics";

/* "Preferências de cookies": reabre o aviso para mudar a escolha (EQZ-01). Sem analytics, não aparece */
export default function BotaoCookies({ className = "" }: { className?: string }) {
  if (!analyticsDisponivel) return null;
  return (
    <button type="button" onClick={abrirPreferenciasCookies} className={`cursor-pointer ${className}`}>
      Preferências de cookies
    </button>
  );
}
