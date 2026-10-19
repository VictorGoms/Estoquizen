"use client";

import Link from "next/link";
import { useRole, can } from "@/hooks/useRole";
import { useProductLimit } from "@/hooks/useProductLimit";
import { BoxIcon } from "@/components/ui/icons";

const fmt = (n: number) => n.toLocaleString("pt-BR");

/**
 * Aviso de limite de produtos do plano (EQZ-06): aparece aos 80% ("40 de 50") e no limite.
 * O dono vê "Ver planos"; os outros, quem procurar.
 */
export default function ProductLimitBanner({ workspaceId }: { workspaceId: string | undefined | null }) {
  const limit      = useProductLimit(workspaceId);
  const canUpgrade = can(useRole(), "canGerenciarAssinatura");

  if (!limit || !limit.near) return null;

  const title = limit.at
    ? `Limite do plano ${limit.label}: ${fmt(limit.count)} de ${fmt(limit.limit)} produtos`
    : `${fmt(limit.count)} de ${fmt(limit.limit)} produtos do plano ${limit.label}`;
  const desc = limit.nextLabel
    ? limit.at
      ? `Para cadastrar mais, mude para o ${limit.nextLabel}, que vai até ${fmt(limit.nextLimit!)} produtos.`
      : `Quando chegar a ${fmt(limit.limit)}, novos cadastros param. No ${limit.nextLabel} cabem até ${fmt(limit.nextLimit!)}.`
    : limit.at
      ? "Para cadastrar outro, remova produtos que você não usa mais."
      : `Quando chegar a ${fmt(limit.limit)}, novos cadastros param.`;

  return (
    <div
      role={limit.at ? "alert" : "status"}
      className={`rounded-4xl px-4 py-3.5 flex items-center justify-between gap-4 flex-wrap ring-1 ${
        limit.at ? "bg-zero/10 ring-zero/30" : "bg-low/10 ring-low/30"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${limit.at ? "bg-zero/15 text-zero" : "bg-low/15 text-low"}`}>
          <BoxIcon className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className={`text-[15px] font-black ${limit.at ? "text-zero" : "text-low"}`}>{title}</p>
          <p className="text-[13px] font-bold text-fg-muted mt-0.5 leading-relaxed">{desc}</p>
        </div>
      </div>

      {limit.nextLabel && (canUpgrade ? (
        <Link
          href="/configuracoes"
          className={`shrink-0 min-h-[44px] px-5 flex items-center rounded-full text-sm font-black transition-[filter] hover:brightness-110 ${
            limit.at ? "bg-zero text-ink" : "bg-accent text-ink"
          }`}
        >
          Ver planos
        </Link>
      ) : (
        <p className="text-[13px] font-bold text-fg-muted">Fale com o dono do workspace.</p>
      ))}
    </div>
  );
}
