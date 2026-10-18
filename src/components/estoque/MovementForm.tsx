"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { sanitizeText } from "@/lib/sanitize";
import { formatQty, parseQtyInput } from "@/lib/stock";
import { InIcon, OutIcon, MinusIcon, PlusIcon, CheckIcon, Spinner } from "@/components/ui/icons";

export type MovementType = "entrada" | "saida";

export interface MovementProduct {
  id: string;
  qty: number;
  unit: string;
}

interface MovementFormProps {
  product: MovementProduct;
  /** Controlado pelo pai (scanner). Sem ele, o formulário guarda o próprio tipo. */
  type?: MovementType;
  onTypeChange?: (type: MovementType) => void;
  hideTypeToggle?: boolean;
  /** Motivo gravado quando o usuário não digita um. */
  reasonFallback?: Record<MovementType, string>;
  onDone?: (newQty: number, delta: number) => void;
}

/** Entrada/saída de estoque via POST /products/:id/adjust (RPC atômica no banco). */
export default function MovementForm({
  product,
  type: typeProp,
  onTypeChange,
  hideTypeToggle = false,
  reasonFallback,
  onDone,
}: MovementFormProps) {
  const [innerType, setInnerType] = useState<MovementType>("entrada");
  const [qtyText, setQtyText]     = useState("1");
  const [reason, setReason]       = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const type = typeProp ?? innerType;
  const isIn = type === "entrada";

  const amount       = parseQtyInput(qtyText);
  const valid        = Number.isFinite(amount) && amount > 0;
  const after        = valid ? product.qty + (isIn ? amount : -amount) : product.qty;
  const insufficient = !isIn && valid && after < 0;

  function changeType(t: MovementType) {
    setInnerType(t);
    onTypeChange?.(t);
    setError("");
  }

  function step(by: number) {
    const base = Number.isFinite(amount) ? amount : 0;
    const next = Math.max(0, Math.round((base + by) * 1000) / 1000);
    setQtyText(String(next).replace(".", ","));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) { setError("Informe uma quantidade maior que zero."); return; }
    if (insufficient) {
      setError(`Estoque insuficiente. Disponível: ${formatQty(product.qty)} ${product.unit}`);
      return;
    }

    setSaving(true);
    setError("");
    const delta = isIn ? amount : -amount;

    try {
      const result = await api.post<{ qty?: number } | null>(`/products/${product.id}/adjust`, {
        delta,
        reason: sanitizeText(reason, 300) || reasonFallback?.[type] || undefined,
      });
      const newQty = result && result.qty !== undefined ? Number(result.qty) : product.qty + delta;
      setQtyText("1");
      setReason("");
      onDone?.(newQty, delta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar movimentação");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      {!hideTypeToggle && (
        <div role="group" aria-label="Tipo de movimentação" className="flex gap-1 p-[5px] rounded-full bg-ink">
          {(["entrada", "saida"] as const).map((t) => {
            const active = type === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={active}
                onClick={() => changeType(t)}
                className={`flex-1 min-h-[44px] rounded-full text-[15px] flex items-center justify-center gap-2 cursor-pointer transition-colors duration-200 ${
                  active ? "bg-accent text-ink font-black" : "text-fg-soft font-extrabold hover:text-fg"
                }`}
              >
                {t === "entrada" ? <InIcon className="w-[18px] h-[18px]" /> : <OutIcon className="w-[18px] h-[18px]" />}
                {t === "entrada" ? "Entrada" : "Saída"}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 rounded-[20px] bg-surface-2">
        <div className="px-3.5 py-3 flex flex-col gap-0.5 border-r-2 border-dashed border-white/10">
          <span className="text-xs font-extrabold text-fg-muted">Estoque atual</span>
          <span>
            <span className="text-[22px] font-black">{formatQty(product.qty)}</span>{" "}
            <span className="text-[13px] font-extrabold text-fg-muted">{product.unit}</span>
          </span>
        </div>
        <div className="px-3.5 py-3 flex flex-col gap-0.5">
          <span className="text-xs font-extrabold text-fg-muted">Depois da {isIn ? "entrada" : "saída"}</span>
          <span>
            <span className={`text-[22px] font-black ${insufficient ? "text-zero" : "text-accent"}`}>{formatQty(after)}</span>{" "}
            <span className="text-[13px] font-extrabold text-fg-muted">{product.unit}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label="Diminuir quantidade"
          onClick={() => step(-1)}
          className="w-[52px] h-[52px] rounded-full bg-surface-2 text-fg flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors duration-200 hover:bg-white/10"
        >
          <MinusIcon className="w-[22px] h-[22px]" strokeWidth={2.4} />
        </button>
        <input
          type="text"
          inputMode="decimal"
          name="quantidade"
          autoComplete="off"
          aria-label={`Quantidade (${product.unit})`}
          value={qtyText}
          onChange={(e) => { setQtyText(e.target.value); setError(""); }}
          className="flex-1 min-w-0 h-[52px] rounded-[18px] bg-ink text-fg text-center text-2xl font-black outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <button
          type="button"
          aria-label="Aumentar quantidade"
          onClick={() => step(1)}
          className="w-[52px] h-[52px] rounded-full bg-surface-2 text-fg flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors duration-200 hover:bg-white/10"
        >
          <PlusIcon className="w-[22px] h-[22px]" strokeWidth={2.4} />
        </button>
      </div>

      <label className="flex flex-col gap-2 text-[13px] font-extrabold text-fg-muted">
        Motivo (opcional)
        <input
          type="text"
          name="motivo"
          autoComplete="off"
          value={reason}
          maxLength={300}
          onChange={(e) => setReason(e.target.value)}
          placeholder={isIn ? "Ex.: compra do fornecedor" : "Ex.: venda no balcão"}
          className="h-12 px-4 rounded-2xl bg-ink text-fg text-[15px] font-semibold outline-none placeholder:text-fg-subtle focus-visible:ring-2 focus-visible:ring-accent"
        />
      </label>

      {error && <p role="alert" className="text-sm font-bold text-zero">{error}</p>}
      {/* O botão fica desativado nesse caso, então o aviso aparece enquanto a pessoa digita */}
      {!error && insufficient && (
        <p role="alert" className="text-sm font-bold text-zero">
          Estoque insuficiente. Disponível: {formatQty(product.qty)} {product.unit}
        </p>
      )}

      <button
        type="submit"
        disabled={saving || !valid || insufficient}
        className="min-h-[54px] px-5 rounded-full bg-accent text-ink text-base font-black flex items-center justify-center gap-2 cursor-pointer transition-[filter] duration-200 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <><Spinner /> Registrando…</>
        ) : (
          <>
            <CheckIcon className="w-5 h-5" strokeWidth={2.6} />
            {isIn ? "Registrar entrada" : "Registrar saída"} de {valid ? formatQty(amount) : 0} {product.unit}
          </>
        )}
      </button>
    </form>
  );
}
