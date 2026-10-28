"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MovementType } from "@/components/estoque/MovementForm";
import { InIcon, OutIcon, XIcon, ArrowRightIcon } from "@/components/ui/icons";

/**
 * "Entrada e saída" (EQZ-69, pedido do João em 2026-10-28: o modo Vários escondido no Escanear não
 * era didático). Pergunta o que a pessoa quer fazer (pôr ou tirar do estoque) e quantos produtos, com
 * uma frase de exemplo em cada opção, e leva para o /scanner já no modo e no tipo escolhidos.
 * Abre pelo cartão da tela inicial e pelo Estoque (botão no computador, menu "+" no celular).
 */
export default function EscolherMovimentacao({ onFechar }: { onFechar: () => void }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<MovementType>("saida");
  const fecharRef = useRef<HTMLButtonElement>(null);
  /* Ref: a tela de trás renderiza de novo (relógio, dados) e não pode tirar o foco daqui */
  const onFecharRef = useRef(onFechar);
  useEffect(() => { onFecharRef.current = onFechar; }, [onFechar]);

  useEffect(() => {
    fecharRef.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onFecharRef.current(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  const ir = (modo: "um" | "varios") => router.push(`/scanner?tipo=${tipo}&modo=${modo}`);
  const saida = tipo === "saida";

  const opcoes = [
    {
      modo:  "um" as const,
      titulo: "Um produto",
      texto:  "Leia o código de barras ou procure pelo nome e diga a quantidade.",
      exemplo: saida ? "Ex.: vendeu uma caixa de leite" : "Ex.: chegou um fardo de água",
    },
    {
      modo:  "varios" as const,
      titulo: "Vários de uma vez",
      texto:  "Monte uma lista, pela câmera ou pelo nome, e registre tudo junto.",
      exemplo: saida ? "Ex.: uma venda grande ou o material de um evento" : "Ex.: a mercadoria que chegou sem nota",
    },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <button type="button" aria-label="Fechar" tabIndex={-1} onClick={onFechar} className="absolute inset-0 bg-ink/80 cursor-default" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="movimentar-titulo"
        className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-surface rounded-t-5xl sm:rounded-5xl p-5 flex flex-col gap-4 *:shrink-0"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="movimentar-titulo" className="text-lg font-black">Entrada e saída</h2>
          <button
            ref={fecharRef}
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center cursor-pointer hover:bg-white/10"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-extrabold text-fg-muted mb-2">1. O que você quer fazer?</legend>
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: "entrada", label: "Pôr no estoque",   sub: "Entrada: chegou mercadoria", Icon: InIcon },
              { id: "saida",   label: "Tirar do estoque", sub: "Saída: venda, perda, uso",   Icon: OutIcon },
            ] as const).map((o) => {
              const ativo = tipo === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => setTipo(o.id)}
                  className={`flex flex-col items-start gap-1.5 p-3.5 rounded-4xl text-left cursor-pointer transition-colors ${
                    ativo ? "bg-accent text-ink" : "bg-surface-2 text-fg hover:bg-white/10"
                  }`}
                >
                  <o.Icon className="w-5 h-5" strokeWidth={2.4} />
                  <span className="text-[15px] font-black leading-tight">{o.label}</span>
                  <span className={`text-[12px] font-bold leading-snug ${ativo ? "text-ink/70" : "text-fg-muted"}`}>{o.sub}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-extrabold text-fg-muted">2. Quantos produtos?</p>
          {opcoes.map((o) => (
            <button
              key={o.modo}
              type="button"
              onClick={() => ir(o.modo)}
              className="group flex items-center gap-3 p-4 rounded-4xl bg-surface-2 text-left cursor-pointer hover:bg-white/10 transition-colors"
            >
              <span className="flex-1 min-w-0 flex flex-col gap-1">
                <span className="text-[16px] font-black">{o.titulo}</span>
                <span className="text-[13px] font-bold text-fg-muted leading-snug">{o.texto}</span>
                <span className="text-[12px] font-bold text-fg-subtle leading-snug">{o.exemplo}</span>
              </span>
              <span className="w-10 h-10 rounded-full bg-ink flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5">
                <ArrowRightIcon className="w-4 h-4" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
