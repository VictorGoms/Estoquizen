"use client";

import { useMemo, useRef, useState } from "react";
import { sanitizeCode } from "@/lib/sanitize";
import { formatQty } from "@/lib/stock";
import { mapaDeCodigos, buscarNoEstoque, type ProdutoLote } from "@/lib/lote";
import { SearchIcon, PlusIcon } from "@/components/ui/icons";

/**
 * Busca de produto pelo nome ou pelo código (EQZ-69), nos modos "Um produto" e "Vários de uma vez"
 * da entrada e saída: é o caminho de quem não tem código de barras. Também recebe o leitor de mão,
 * que digita o código e dá Enter. Busca sem acento e com as palavras em qualquer ordem (lib/lote.ts).
 */
export default function BuscaProduto<P extends ProdutoLote>({ produtos, carregando = false, onEscolher, onCodigoDesconhecido, rotulo = "Buscar pelo nome ou código" }: {
  produtos:              P[];
  carregando?:           boolean;
  onEscolher:            (produto: P) => void;
  /** Código de barras digitado (ou do leitor de mão) que não está cadastrado */
  onCodigoDesconhecido?: (codigo: string) => void;
  rotulo?:               string;
}) {
  const [busca, setBusca] = useState("");
  const campoRef  = useRef<HTMLInputElement>(null);
  const porCodigo = useMemo(() => mapaDeCodigos(produtos), [produtos]);
  const resultados = busca.trim() ? buscarNoEstoque(produtos, busca, 6) : [];

  function escolher(p: P) {
    onEscolher(p);
    setBusca("");
    campoRef.current?.focus();
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const termo = busca.trim();
    if (!termo) return;
    /* Leitor de mão: digita o código inteiro e dá Enter */
    const exato = porCodigo.get(sanitizeCode(termo));
    if (exato) { escolher(exato as P); return; }
    if (resultados.length === 1) { escolher(resultados[0] as P); return; }
    if (!resultados.length && /^\d{8,14}$/.test(termo) && onCodigoDesconhecido) {
      onCodigoDesconhecido(sanitizeCode(termo));
      setBusca("");
    }
  }

  return (
    <form onSubmit={enviar}>
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fg-subtle pointer-events-none" />
        <input
          ref={campoRef}
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          autoComplete="off"
          enterKeyHint="enter"
          aria-label={rotulo}
          placeholder={carregando ? "Carregando os produtos…" : rotulo}
          className="w-full h-[52px] pl-12 pr-4 rounded-full bg-surface text-[15px] font-semibold text-fg outline-hidden placeholder:text-fg-subtle focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>
      {resultados.length > 0 && (
        <ul className="mt-2 p-1.5 rounded-4xl bg-surface-2 flex flex-col">
          {resultados.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => escolher(p as P)}
                className="w-full flex items-center gap-3 min-h-[48px] px-3 rounded-3xl text-left cursor-pointer hover:bg-white/10"
              >
                <span className="flex-1 min-w-0 text-[15px] font-extrabold truncate">{p.name}</span>
                <span className="text-[13px] font-bold text-fg-muted shrink-0">tem {formatQty(p.qty)} {p.unit}</span>
                <PlusIcon className="w-4 h-4 text-accent shrink-0" strokeWidth={2.6} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {busca.trim() && !resultados.length && !carregando && (
        <p className="mt-2 px-4 text-[13px] font-bold text-fg-subtle">Nenhum produto com esse nome ou código.</p>
      )}
    </form>
  );
}
