"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { productInitials } from "@/lib/stock";
import { ICONES, SEM_ICONE, iconeDoNome, iconesPorGrupo, urlIcone } from "@/lib/iconeProduto";
import { XIcon, Spinner } from "@/components/ui/icons";

interface IconPickerProps {
  nome:      string;
  /** products.icon: chave escolhida, "nenhum" (só iniciais) ou null (automático) */
  atual:     string | null;
  temFoto:   boolean;
  salvando:  boolean;
  onEscolher: (valor: string | null) => void;
  onRemoverFoto?: () => void;
  onFechar:  () => void;
}

const GRUPOS = iconesPorGrupo();

/** Escolha do ícone do produto (EQZ-30): automático pelo nome, só iniciais ou um dos 80 ícones. */
export default function IconPicker({ nome, atual, temFoto, salvando, onEscolher, onRemoverFoto, onFechar }: IconPickerProps) {
  const fecharRef = useRef<HTMLButtonElement>(null);
  const auto      = iconeDoNome(nome);

  useEffect(() => {
    fecharRef.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onFechar(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  const opcao = (ativo: boolean) =>
    `flex items-center gap-3 min-h-[56px] px-3 rounded-3xl text-left cursor-pointer transition-colors disabled:opacity-60 ${
      ativo ? "bg-inverse text-ink" : "bg-surface-2 hover:bg-white/10"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button type="button" aria-label="Fechar" tabIndex={-1} onClick={onFechar} className="absolute inset-0 bg-ink/70 cursor-default" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="icone-titulo"
        className="relative w-full sm:max-w-lg max-h-[85vh] overflow-y-auto bg-surface rounded-t-5xl sm:rounded-5xl p-5 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="icone-titulo" className="text-lg font-black">Ícone do produto</h2>
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

        {temFoto && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 rounded-3xl bg-surface-2 text-[13px] font-bold text-fg-muted">
            <span>A foto aparece no lugar do ícone.</span>
            {onRemoverFoto && (
              <button type="button" onClick={onRemoverFoto} disabled={salvando} className="font-extrabold text-zero cursor-pointer hover:underline disabled:opacity-60">
                Remover foto
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button type="button" aria-pressed={!atual} disabled={salvando} onClick={() => onEscolher(null)} className={opcao(!atual)}>
            <span className="w-10 h-10 rounded-full bg-ink flex items-center justify-center shrink-0 text-sm font-black text-fg">
              {auto
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={urlIcone(auto)} alt="" className="w-[66%] h-[66%]" />
                : productInitials(nome)}
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-black">Automático</span>
              <span className={`text-[12px] font-bold ${!atual ? "text-inverse-muted" : "text-fg-muted"}`}>Pelo nome do produto</span>
            </span>
          </button>
          <button type="button" aria-pressed={atual === SEM_ICONE} disabled={salvando} onClick={() => onEscolher(SEM_ICONE)} className={opcao(atual === SEM_ICONE)}>
            <span className="w-10 h-10 rounded-full bg-ink flex items-center justify-center shrink-0 text-sm font-black text-fg">
              {productInitials(nome)}
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-black">Só as iniciais</span>
              <span className={`text-[12px] font-bold ${atual === SEM_ICONE ? "text-inverse-muted" : "text-fg-muted"}`}>Sem ícone</span>
            </span>
          </button>
        </div>

        {GRUPOS.map(({ grupo, chaves }) => (
          <section key={grupo} aria-label={grupo} className="flex flex-col gap-2">
            <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-fg-subtle">{grupo}</h3>
            <div className="grid grid-cols-6 sm:grid-cols-7 gap-2">
              {chaves.map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-label={ICONES[k][0]}
                  title={ICONES[k][0]}
                  aria-pressed={atual === k}
                  disabled={salvando}
                  onClick={() => onEscolher(k)}
                  className={`aspect-square rounded-full flex items-center justify-center cursor-pointer transition-colors disabled:opacity-60 ${
                    atual === k ? "bg-inverse ring-2 ring-accent" : "bg-surface-2 hover:bg-white/10"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urlIcone(k)} alt="" loading="lazy" className="w-[62%] h-[62%]" />
                </button>
              ))}
            </div>
          </section>
        ))}

        {salvando && (
          <p role="status" className="flex items-center gap-2 text-sm font-bold text-fg-muted"><Spinner className="w-4 h-4" /> Salvando…</p>
        )}
        <p className="text-[12px] font-bold text-fg-subtle">
          Ícones: Microsoft Fluent Emoji (licença MIT). <Link href="/licencas" className="underline underline-offset-2">Licenças</Link>
        </p>
      </div>
    </div>
  );
}
