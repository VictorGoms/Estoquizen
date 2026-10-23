"use client";

import { useState } from "react";
import BarcodeScanner from "@/components/ui/BarcodeScanner";
import { inputClass } from "@/components/ui/FormField";
import { UNIDADES } from "@/lib/segmentos";
import { parseQtyInput, parsePriceInput } from "@/lib/stock";
import { sanitizeCode } from "@/lib/sanitize";
import { buscarPorCodigo } from "@/lib/codigoBarras";
import { ScanIcon, PlusIcon, Spinner } from "@/components/ui/icons";

export interface ItemDigitado {
  name:      string;
  code:      string;
  unit:      string;
  qty:       number;
  unitPrice: number;
}

/**
 * EQZ-34: item da nota digitado à mão, quando a SEFAZ não deixou ler a nota (ou faltou um item). O
 * código de barras é opcional; lido pela câmera ou digitado, sugere o nome (bases abertas e catálogo,
 * EQZ-53). Depois de adicionar, o formulário limpa para o próximo item.
 */
export default function AdicionarItemNota({ onAdicionar, onFechar }: {
  onAdicionar: (item: ItemDigitado) => void;
  onFechar:    () => void;
}) {
  const [code, setCode]         = useState("");
  const [name, setName]         = useState("");
  const [qty, setQty]           = useState("1");
  const [unit, setUnit]         = useState("un");
  const [price, setPrice]       = useState("");
  const [lendo, setLendo]       = useState(false);
  const [buscando, setBuscando] = useState(false);
  /* De onde veio o nome sugerido pelo código ("pelo Open Food Facts"); null = digitado */
  const [sugerido, setSugerido] = useState<string | null>(null);
  const [erro, setErro]         = useState("");

  async function usarCodigo(raw: string) {
    const c = sanitizeCode(raw);
    setCode(c);
    setLendo(false);
    const digitos = c.replace(/\D/g, "");
    if (digitos.length < 8 || name.trim()) return;
    setBuscando(true);
    const achado = await buscarPorCodigo(digitos);
    setBuscando(false);
    if (achado?.nome) { setName(achado.nome); setSugerido(achado.fonte); }
  }

  function adicionar(e: React.FormEvent) {
    e.preventDefault();
    const q = parseQtyInput(qty);
    const p = price.trim() ? parsePriceInput(price) : 0;
    if (!name.trim())             { setErro("Preencha o nome do produto."); return; }
    if (!(q > 0))                 { setErro("A quantidade precisa ser maior que zero."); return; }
    if (!Number.isFinite(p) || p < 0) { setErro("Confira o preço: use só números e vírgula (ex.: 12,50)."); return; }
    onAdicionar({ name: name.trim(), code, unit, qty: q, unitPrice: p });
    setCode(""); setName(""); setQty("1"); setPrice(""); setSugerido(null); setErro("");
  }

  const rotulo = "text-sm font-extrabold text-fg-muted";

  return (
    <>
    <form onSubmit={adicionar} className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-black">Adicionar item da nota</h2>
        <p className="text-sm font-bold text-fg-muted">Copie do cupom. Com o código de barras, o nome costuma vir sozinho.</p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={rotulo}>Código de barras (opcional)</span>
        <span className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(sanitizeCode(e.target.value))}
            onBlur={(e) => void usarCodigo(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            placeholder="7891234567890"
            className={`${inputClass} flex-1 min-w-0 tabular-nums`}
          />
          <button
            type="button"
            onClick={() => setLendo(true)}
            aria-label="Ler o código de barras pela câmera"
            className="w-[52px] shrink-0 rounded-full bg-surface-2 flex items-center justify-center cursor-pointer hover:bg-white/10"
          >
            <ScanIcon className="w-5 h-5" />
          </button>
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={rotulo}>Nome do produto</span>
        <span className="relative">
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setSugerido(null); }}
            autoComplete="off"
            placeholder={buscando ? "Procurando pelo código…" : "Ex.: Arroz branco 5kg"}
            className={`${inputClass} w-full`}
          />
          {buscando && <Spinner className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />}
        </span>
        {sugerido && <span className="text-[13px] font-bold text-accent">Nome sugerido {sugerido}. Confira antes de adicionar.</span>}
      </label>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={rotulo}>Quantidade</span>
          <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" className={`${inputClass} tabular-nums`} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={rotulo}>Unidade</span>
          <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inputClass}>
            {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
          <span className={rotulo}>Preço unitário (opcional)</span>
          <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="0,00" className={`${inputClass} tabular-nums`} />
        </label>
      </div>

      {erro && <p role="alert" className="text-sm font-bold text-zero">{erro}</p>}

      <div className="flex flex-wrap gap-2.5">
        <button type="submit" className="min-h-[48px] px-5 rounded-full bg-accent text-ink text-sm font-black cursor-pointer hover:brightness-110 transition-[filter] flex items-center gap-2">
          <PlusIcon className="w-4 h-4" strokeWidth={2.6} /> Adicionar à nota
        </button>
        <button type="button" onClick={onFechar} className="min-h-[48px] px-5 rounded-full text-sm font-extrabold text-fg-muted cursor-pointer hover:bg-white/5 hover:text-fg transition-colors">
          Fechar
        </button>
      </div>
    </form>

    {/* Fora do form: os botões do leitor não podem enviar o formulário */}
    {lendo && (
      <BarcodeScanner
        title="Código do produto"
        subtitle="Aponte para o código de barras da embalagem"
        onDetect={(c) => void usarCodigo(c)}
        onClose={() => setLendo(false)}
      />
    )}
    </>
  );
}
