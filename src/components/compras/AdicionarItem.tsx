"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProductAvatar from "@/components/estoque/ProductAvatar";
import type { Product } from "@/hooks/useProducts";
import { formatQty, parseQtyInput } from "@/lib/stock";
import { XIcon, SearchIcon, Spinner } from "@/components/ui/icons";

const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

interface AdicionarItemProps {
  /** Produtos que ainda não estão na lista */
  produtos:  Product[];
  /** Quantidade sugerida para cada produto (a mesma regra da lista automática) */
  sugerida:  (p: Product) => number;
  onAdicionar: (p: Product, qtd: number) => Promise<void>;
  onFechar:  () => void;
}

/** Escolher um produto do estoque para pôr na lista de compras, mesmo sem estar no mínimo. */
export default function AdicionarItem({ produtos, sugerida, onAdicionar, onFechar }: AdicionarItemProps) {
  const [busca, setBusca]       = useState("");
  const [escolhido, setEscolhido] = useState<Product | null>(null);
  const [qtd, setQtd]           = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState("");
  const buscaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    buscaRef.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onFechar(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  const visiveis = useMemo(() => {
    const t = normalizar(busca.trim());
    const lista = t ? produtos.filter((p) => normalizar(p.name).includes(t) || (p.code ?? "").toLowerCase().includes(t)) : produtos;
    return lista.slice(0, 50);
  }, [produtos, busca]);

  function escolher(p: Product) {
    setEscolhido(p);
    setQtd(String(sugerida(p)).replace(".", ","));
    setErro("");
  }

  async function confirmar() {
    if (!escolhido) return;
    const n = parseQtyInput(qtd);
    if (!(n > 0)) { setErro("Digite quanto comprar."); return; }
    setSalvando(true);
    setErro("");
    try {
      await onAdicionar(escolhido, n);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível adicionar. Tente novamente.");
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button type="button" aria-label="Fechar" tabIndex={-1} onClick={onFechar} className="absolute inset-0 bg-ink/70 cursor-default" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-compra-titulo"
        className="relative w-full sm:max-w-lg max-h-[85vh] bg-surface rounded-t-5xl sm:rounded-5xl p-5 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="add-compra-titulo" className="text-lg font-black">Adicionar à lista</h2>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center cursor-pointer hover:bg-white/10">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {escolhido ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-3 rounded-[22px] bg-surface-2">
              <ProductAvatar name={escolhido.name} imageUrl={escolhido.image_url} icon={escolhido.icon} />
              <div className="flex-1 min-w-0 flex flex-col">
                <span className="text-[15px] font-extrabold truncate">{escolhido.name}</span>
                <span className="text-[13px] font-bold text-fg-muted">Tem {formatQty(escolhido.qty)} {escolhido.unit} · mínimo {formatQty(escolhido.min_qty ?? 0)}</span>
              </div>
            </div>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm font-extrabold">Quanto comprar</span>
              <span className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={qtd}
                  onChange={(e) => setQtd(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") confirmar(); }}
                  autoFocus
                  className="w-24 h-12 rounded-full bg-ink text-center text-lg font-black tabular-nums outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                />
                <span className="text-sm font-bold text-fg-muted w-10">{escolhido.unit}</span>
              </span>
            </label>
            {erro && <p role="alert" className="text-sm font-bold text-zero">{erro}</p>}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={confirmar}
                disabled={salvando}
                className="flex-1 min-h-[52px] rounded-full bg-accent text-ink text-[15px] font-black flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 transition-[filter] disabled:opacity-60"
              >
                {salvando && <Spinner className="w-4 h-4" />}
                {salvando ? "Adicionando…" : "Adicionar à lista"}
              </button>
              <button
                type="button"
                onClick={() => setEscolhido(null)}
                disabled={salvando}
                className="min-h-[52px] px-5 rounded-full bg-surface-2 text-[15px] font-extrabold cursor-pointer hover:bg-white/10"
              >
                Voltar
              </button>
            </div>
          </div>
        ) : (
          <>
            <label className="relative">
              <span className="sr-only">Buscar produto</span>
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-fg-muted" />
              <input
                ref={buscaRef}
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar produto ou código"
                className="w-full min-h-[48px] pl-11 pr-5 rounded-full bg-surface-2 text-[15px] font-bold text-fg placeholder:text-fg-subtle outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </label>
            <ul className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 -mx-1 px-1">
              {visiveis.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => escolher(p)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-[20px] text-left cursor-pointer hover:bg-surface-2 transition-colors"
                  >
                    <ProductAvatar name={p.name} imageUrl={p.image_url} icon={p.icon} />
                    <span className="flex-1 min-w-0 flex flex-col">
                      <span className="text-[15px] font-extrabold truncate">{p.name}</span>
                      <span className="text-[13px] font-bold text-fg-muted">Tem {formatQty(p.qty)} {p.unit} · mínimo {formatQty(p.min_qty ?? 0)}</span>
                    </span>
                  </button>
                </li>
              ))}
              {visiveis.length === 0 && (
                <li className="py-8 text-center text-sm font-bold text-fg-muted">
                  {produtos.length === 0 ? "Todos os produtos já estão na lista." : "Nenhum produto com esse nome."}
                </li>
              )}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
