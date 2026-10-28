"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import BarcodeScanner from "@/components/ui/BarcodeScanner";
import ProductAvatar from "@/components/estoque/ProductAvatar";
import type { MovementType } from "@/components/estoque/MovementForm";
import { api } from "@/lib/api";
import { useProducts, mutateProducts } from "@/hooks/useProducts";
import { mutateStats } from "@/hooks/useStats";
import { mutateMovements } from "@/hooks/useMovements";
import { sanitizeCode } from "@/lib/sanitize";
import { formatQty, formatBRL, parseQtyInput, MOTIVOS, MOTIVOS_SAIDA, type Motivo } from "@/lib/stock";
import {
  somarNaLista, mudarQuantidade, faltandoNaSaida, valorDaLista, mapaDeCodigos, buscarNoEstoque,
  type LinhaLote, type ProdutoLote,
} from "@/lib/lote";
import { MinusIcon, PlusIcon, XIcon, SearchIcon, ScanIcon, CheckIcon, Spinner } from "@/components/ui/icons";

type ProdutoTela = ProdutoLote & { image_url: string | null; icon: string | null };

/* A lista fica guardada neste navegador até ser registrada (recarregar a página não perde nada) */
const chaveRascunho = (ws: string) => `estoquizen_lote:${ws}`;
const CHAVE_CAMERA  = "estoquizen_lote_camera";

/* Assinatura curta da lista, para a Idempotency-Key mudar quando a lista muda (EQZ-67) */
function assinatura(linhas: LinhaLote[]): string {
  let h = 5381;
  for (const c of linhas.map((l) => `${l.id}:${l.qtd}`).join("|")) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
  return h.toString(16);
}

/** Quantidade de uma linha: − campo + (aceita fração, como 0,5 kg) */
function Quantidade({ valor, unidade, onMudar }: { valor: number; unidade: string; onMudar: (n: number) => void }) {
  /* Texto enquanto a pessoa digita; null = mostra o valor atual */
  const [rascunho, setRascunho] = useState<string | null>(null);
  const confirmar = () => {
    if (rascunho === null) return;
    const n = parseQtyInput(rascunho);
    if (Number.isFinite(n)) onMudar(n);
    setRascunho(null);
  };
  const botao = "w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center shrink-0 cursor-pointer hover:bg-white/10";
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button type="button" aria-label="Diminuir" onClick={() => onMudar(Math.max(0, Math.round((valor - 1) * 1000) / 1000))} className={botao}>
        <MinusIcon className="w-4 h-4" strokeWidth={2.6} />
      </button>
      <input
        type="text"
        inputMode="decimal"
        aria-label={`Quantidade (${unidade})`}
        value={rascunho ?? formatQty(valor)}
        onChange={(e) => setRascunho(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmar(); } }}
        className="w-14 h-10 rounded-2xl bg-ink text-center text-[15px] font-black outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
      />
      <button type="button" aria-label="Aumentar" onClick={() => onMudar(valor + 1)} className={botao}>
        <PlusIcon className="w-4 h-4" strokeWidth={2.6} />
      </button>
    </div>
  );
}

/**
 * Modo "Vários" do Escanear (EQZ-69): monta uma lista de produtos e registra a entrada ou a saída de
 * todos de uma vez. Pela câmera (leitura contínua), pelo leitor de mão (digita o código e dá Enter no
 * campo de busca) ou pela busca pelo nome, para quem não tem código de barras. Na saída, produto com
 * mais do que o estoque bloqueia o registro, com aviso na linha (decisão do João). Regras em lib/lote.ts.
 */
export default function MovimentarVarios({ workspaceId, tipo, podeCadastrar }: {
  workspaceId:   string;
  tipo:          MovementType;
  podeCadastrar: boolean;
}) {
  const { products, loading } = useProducts(workspaceId);
  const [linhas, setLinhas]           = useState<LinhaLote[]>([]);
  const [restaurado, setRestaurado]   = useState(false);
  const [semCadastro, setSemCadastro] = useState<string[]>([]);
  const [motivo, setMotivo]           = useState<Motivo>("venda");
  const [busca, setBusca]             = useState("");
  const [camera, setCamera]           = useState(true);
  /* Última linha que entrou ou somou, para a pessoa ver que a leitura valeu */
  const [destaque, setDestaque]       = useState<string | null>(null);
  const [enviando, setEnviando]       = useState(false);
  const [erro, setErro]               = useState("");
  const [feito, setFeito]             = useState<{ tipo: MovementType; produtos: number; valor: number } | null>(null);
  const chave    = useRef<string | null>(null);
  const campoRef = useRef<HTMLInputElement>(null);

  const produtos = useMemo<ProdutoTela[]>(() => products.map((p) => ({
    id: p.id, name: p.name, code: p.code, qty: Number(p.qty), unit: p.unit, price: Number(p.price), image_url: p.image_url, icon: p.icon,
  })), [products]);
  const porId     = useMemo(() => new Map(produtos.map((p) => [p.id, p])), [produtos]);
  const porCodigo = useMemo(() => mapaDeCodigos(produtos), [produtos]);

  /* Rascunho e preferência da câmera deste navegador */
  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(chaveRascunho(workspaceId)) ?? "null") as { linhas?: LinhaLote[] } | null;
      if (Array.isArray(salvo?.linhas)) {
        setLinhas(salvo.linhas.filter((l) => typeof l?.id === "string" && typeof l?.qtd === "number" && l.qtd > 0));
      }
      if (localStorage.getItem(CHAVE_CAMERA) === "0") setCamera(false);
    } catch { /* navegador sem armazenamento */ }
    setRestaurado(true);
  }, [workspaceId]);

  useEffect(() => {
    if (!restaurado) return;
    try {
      if (linhas.length) localStorage.setItem(chaveRascunho(workspaceId), JSON.stringify({ linhas }));
      else localStorage.removeItem(chaveRascunho(workspaceId));
    } catch { /* navegador sem armazenamento */ }
  }, [linhas, restaurado, workspaceId]);

  /* Produto excluído enquanto estava na lista some dela */
  const validas   = loading ? linhas : linhas.filter((l) => porId.has(l.id));
  const faltando  = tipo === "saida" ? faltandoNaSaida(validas, porId) : new Set<string>();
  const bloqueado = faltando.size > 0;
  const valor     = valorDaLista(validas, porId);
  const resultados = busca.trim() ? buscarNoEstoque(produtos, busca, 6) : [];

  const adicionar = useCallback((id: string) => {
    setLinhas((l) => somarNaLista(l, id));
    setDestaque(id);
    setFeito(null);
    setErro("");
    try { navigator.vibrate?.(40); } catch { /* sem vibração */ }
  }, []);

  /* Câmera e leitor de mão: o código vira produto na hora, sem ir ao servidor */
  const lerCodigo = useCallback((bruto: string) => {
    const codigo = sanitizeCode(bruto);
    if (!codigo) return;
    const p = porCodigo.get(codigo);
    if (p) adicionar(p.id);
    else setSemCadastro((s) => (s.includes(codigo) ? s : [codigo, ...s].slice(0, 20)));
  }, [porCodigo, adicionar]);

  function enviarBusca(e: React.FormEvent) {
    e.preventDefault();
    const termo = busca.trim();
    if (!termo) return;
    /* Leitor de mão: digita o código inteiro e dá Enter */
    const exato = porCodigo.get(sanitizeCode(termo));
    if (exato) { adicionar(exato.id); setBusca(""); return; }
    if (resultados.length === 1) { adicionar(resultados[0].id); setBusca(""); return; }
    if (!resultados.length && /^\d{8,14}$/.test(termo)) { lerCodigo(termo); setBusca(""); }
  }

  function alternarCamera() {
    setCamera((c) => {
      try { localStorage.setItem(CHAVE_CAMERA, c ? "0" : "1"); } catch { /* sem armazenamento */ }
      return !c;
    });
  }

  async function registrar() {
    if (!validas.length || bloqueado || enviando) return;
    setEnviando(true);
    setErro("");
    /* A mesma chave até dar certo (EQZ-67), amarrada ao conteúdo da lista */
    chave.current ??= crypto.randomUUID();
    try {
      await api.post("/products/adjust-batch", {
        workspace_id: workspaceId,
        tipo,
        ...(tipo === "saida" ? { motivo } : {}),
        itens: validas.map((l) => ({ product_id: l.id, qty: l.qtd })),
      }, { "Idempotency-Key": `${chave.current}:${assinatura(validas)}` });
      chave.current = null;
      setFeito({ tipo, produtos: validas.length, valor: tipo === "saida" ? valor : 0 });
      setLinhas([]);
      setSemCadastro([]);
      setDestaque(null);
      setMotivo("venda");
      mutateProducts(workspaceId);
      mutateStats(workspaceId);
      mutateMovements(workspaceId);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível registrar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  const saida = tipo === "saida";

  return (
    <div className="flex flex-col gap-4">
      {/* Câmera (leitura contínua) */}
      {camera && (
        loading ? (
          <div className="h-[200px] rounded-5xl bg-surface flex items-center justify-center gap-3 text-fg-muted font-bold">
            <Spinner /> Carregando os produtos…
          </div>
        ) : (
          <BarcodeScanner variant="embedded" continuo onDetect={lerCodigo} />
        )
      )}
      <button
        type="button"
        onClick={alternarCamera}
        className="self-center flex items-center gap-2 min-h-[40px] px-4 rounded-full text-sm font-extrabold text-fg-muted cursor-pointer hover:text-fg"
      >
        <ScanIcon className="w-4 h-4" /> {camera ? "Fechar a câmera (buscar pelo nome)" : "Abrir a câmera"}
      </button>

      {/* Busca pelo nome; também recebe o leitor de mão, que digita o código e dá Enter */}
      <form onSubmit={enviarBusca} className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fg-subtle pointer-events-none" />
        <input
          ref={campoRef}
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          autoComplete="off"
          enterKeyHint="enter"
          aria-label="Buscar produto pelo nome ou código"
          placeholder="Buscar pelo nome ou código"
          className="w-full h-[52px] pl-12 pr-4 rounded-full bg-surface text-[15px] font-semibold text-fg outline-hidden placeholder:text-fg-subtle focus-visible:ring-2 focus-visible:ring-accent"
        />
        {resultados.length > 0 && (
          <ul className="mt-2 p-1.5 rounded-4xl bg-surface-2 flex flex-col">
            {resultados.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => { adicionar(p.id); setBusca(""); campoRef.current?.focus(); }}
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
        {busca.trim() && !resultados.length && !loading && (
          <p className="mt-2 px-4 text-[13px] font-bold text-fg-subtle">Nenhum produto com esse nome ou código.</p>
        )}
      </form>

      {/* Códigos lidos que não estão cadastrados */}
      {semCadastro.length > 0 && (
        <div className="p-4 rounded-4xl bg-low/10 flex flex-col gap-2.5">
          <p className="text-sm font-black text-low">
            {semCadastro.length === 1 ? "1 código não está cadastrado" : `${semCadastro.length} códigos não estão cadastrados`} e ficou fora da lista
          </p>
          <ul className="flex flex-col gap-1.5">
            {semCadastro.map((c) => (
              <li key={c} className="flex items-center gap-2">
                <span className="flex-1 min-w-0 text-[13px] font-extrabold tracking-wide truncate">{c}</span>
                {podeCadastrar && (
                  <Link href={`/estoque/novo?code=${encodeURIComponent(c)}`} className="min-h-[36px] px-3 flex items-center rounded-full bg-surface-2 text-[13px] font-extrabold hover:bg-white/10">
                    Cadastrar
                  </Link>
                )}
                <button
                  type="button"
                  aria-label={`Esquecer o código ${c}`}
                  onClick={() => setSemCadastro((s) => s.filter((x) => x !== c))}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-fg-muted cursor-pointer hover:bg-white/10"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
          {podeCadastrar && <p className="text-[12px] font-bold text-fg-subtle">A lista fica guardada enquanto você cadastra.</p>}
        </div>
      )}

      {feito && validas.length === 0 && (
        <div role="status" className="p-4 rounded-4xl bg-ok/10 flex items-center gap-3.5">
          <span className="w-10 h-10 rounded-full bg-ok text-ink flex items-center justify-center shrink-0">
            <CheckIcon className="w-5 h-5" strokeWidth={3} />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-black text-ok">{feito.tipo === "saida" ? "Saída registrada" : "Entrada registrada"}</p>
            <p className="text-[13px] font-bold text-fg-muted">
              {feito.produtos} {feito.produtos === 1 ? "produto" : "produtos"}{feito.valor > 0 ? ` · ${formatBRL(feito.valor)}` : ""}. Pode começar a próxima lista.
            </p>
          </div>
        </div>
      )}

      {/* A lista */}
      {validas.length === 0 ? (
        !feito && (
          <p className="py-8 px-6 text-center text-sm font-bold text-fg-subtle border-2 border-dashed border-white/8 rounded-5xl">
            Leia os códigos ou busque pelo nome. Cada produto entra na lista; ler de novo soma 1.
          </p>
        )
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Produtos da lista">
          {validas.map((l) => {
            const p = porId.get(l.id);
            if (!p) return null;
            const falta = faltando.has(l.id);
            return (
              /* No celular a quantidade vai para a 2ª linha: o nome do produto aparece inteiro */
              <li
                key={l.id}
                className={`bg-surface rounded-[22px] p-3 flex flex-col sm:flex-row sm:items-center gap-2.5 ${
                  falta ? "ring-1 ring-zero/60" : destaque === l.id ? "ring-1 ring-accent/60" : ""
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <ProductAvatar name={p.name} imageUrl={p.image_url} icon={p.icon} />
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <p className="text-[15px] font-extrabold leading-snug line-clamp-2" title={p.name}>{p.name}</p>
                    <p className="text-[12px] font-bold text-fg-muted">
                      {falta
                        ? <span className="text-zero font-black">Só tem {formatQty(p.qty)} {p.unit}</span>
                        : <>Tem {formatQty(p.qty)} {p.unit}</>}
                      {saida && p.price > 0 ? ` · ${formatBRL(p.price)}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Tirar ${p.name} da lista`}
                    onClick={() => setLinhas((ls) => mudarQuantidade(ls, l.id, 0))}
                    className="sm:order-last w-9 h-9 rounded-full flex items-center justify-center text-fg-muted shrink-0 cursor-pointer hover:bg-white/10"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="self-end sm:self-auto">
                  <Quantidade valor={l.qtd} unidade={p.unit} onMudar={(n) => setLinhas((ls) => mudarQuantidade(ls, l.id, n))} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Registrar tudo de uma vez */}
      {validas.length > 0 && (
        <div className="sticky bottom-3 z-10 p-3.5 rounded-[30px] bg-surface-2 shadow-nav flex flex-col gap-2.5">
          {/* Motivos numa faixa só, que rola de lado: o painel não cobre a lista */}
          {saida && (
            <div role="group" aria-label="Motivo da saída" className="-mx-3.5 px-3.5 flex gap-1.5 overflow-x-auto [scrollbar-width:none] *:shrink-0">
              {MOTIVOS_SAIDA.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={motivo === m}
                  onClick={() => setMotivo(m)}
                  className={`min-h-[34px] px-3 rounded-full text-[13px] cursor-pointer transition-colors ${
                    motivo === m ? "bg-inverse text-ink font-black" : "bg-ink text-fg-soft font-extrabold hover:text-fg"
                  }`}
                >
                  {MOTIVOS[m]}
                </button>
              ))}
            </div>
          )}

          <p className="flex items-baseline justify-between gap-3 text-sm font-bold text-fg-muted">
            <span>{validas.length} {validas.length === 1 ? "produto" : "produtos"}</span>
            {saida && valor > 0 && <span>Total <span className="text-fg text-lg font-black">{formatBRL(valor)}</span></span>}
          </p>

          {bloqueado && (
            <p role="alert" className="text-sm font-bold text-zero">
              {faltando.size === 1 ? "1 produto tem" : `${faltando.size} produtos têm`} menos no estoque do que na lista. Ajuste a quantidade ou tire da lista.
            </p>
          )}
          {erro && <p role="alert" className="text-sm font-bold text-zero">{erro}</p>}

          <button
            type="button"
            onClick={registrar}
            disabled={enviando || bloqueado}
            className="min-h-[54px] rounded-full bg-accent text-ink text-base font-black flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 transition-[filter] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? <><Spinner /> Registrando…</> : <><CheckIcon className="w-5 h-5" strokeWidth={2.6} /> {saida ? "Registrar saída" : "Registrar entrada"} de {validas.length} {validas.length === 1 ? "produto" : "produtos"}</>}
          </button>
        </div>
      )}
    </div>
  );
}
