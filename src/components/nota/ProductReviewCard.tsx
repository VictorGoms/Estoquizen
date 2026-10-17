"use client";

import { useState } from "react";
import ProductAvatar from "@/components/estoque/ProductAvatar";
import { MinusIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { formatBRL, formatQty, parseQtyInput } from "@/lib/stock";

export interface ReviewProduct {
  id: string;
  code: string;
  name: string;
  unit: string;
  qty: number;
  unitPrice: number;
  status: "novo" | "existente" | "divergente";
}

const STATUS_CONFIG: Record<ReviewProduct["status"], { label: string; chip: string }> = {
  novo:       { label: "Novo",        chip: "bg-accent/15 text-accent" },
  existente:  { label: "Cadastrado",  chip: "bg-ok/15 text-ok" },
  divergente: { label: "Divergência", chip: "bg-low/15 text-low" },
};

interface ProductReviewCardProps {
  product: ReviewProduct;
  editMode: boolean;
  onQtyChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

export default function ProductReviewCard({ product, editMode, onQtyChange, onRemove }: ProductReviewCardProps) {
  /* Texto do campo enquanto a pessoa digita; null = mostra a quantidade atual */
  const [draft, setDraft] = useState<string | null>(null);
  const st = STATUS_CONFIG[product.status];

  function commitDraft() {
    if (draft === null) return;
    const n = parseQtyInput(draft);
    if (n > 0) onQtyChange(product.id, n);
    setDraft(null);
  }

  return (
    <li
      className={`bg-surface rounded-[22px] p-3 pr-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 ${
        product.status === "divergente" ? "ring-1 ring-low/30" : ""
      }`}
    >
      {/* Produto */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <ProductAvatar name={product.name} />
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p className="text-[15px] font-extrabold truncate" title={product.name}>{product.name}</p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-bold text-fg-muted">
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${st.chip}`}>{st.label}</span>
            <span>{formatBRL(product.unitPrice ?? 0)} / {product.unit}</span>
            {product.code && <span className="text-fg-subtle tabular-nums truncate">· {product.code}</span>}
          </p>
        </div>
      </div>

      {/* Quantidade · total · remover */}
      <div className={`flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-4 sm:pl-0 ${editMode ? "" : "pl-[62px]"}`}>
        {editMode ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onQtyChange(product.id, round3(product.qty - 1))}
              disabled={product.qty <= 1}
              aria-label={`Diminuir quantidade de ${product.name}`}
              className="w-11 h-11 rounded-full bg-surface-2 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <MinusIcon className="w-[18px] h-[18px]" strokeWidth={2.6} />
            </button>
            <input
              type="text"
              inputMode="decimal"
              aria-label={`Quantidade de ${product.name} (${product.unit})`}
              value={draft ?? String(product.qty).replace(".", ",")}
              onFocus={(e) => { setDraft(String(product.qty).replace(".", ",")); e.currentTarget.select(); }}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitDraft}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }}
              className="w-16 h-11 rounded-full bg-ink text-center text-[15px] font-black tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <button
              type="button"
              onClick={() => onQtyChange(product.id, round3(product.qty + 1))}
              aria-label={`Aumentar quantidade de ${product.name}`}
              className="w-11 h-11 rounded-full bg-surface-2 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
            >
              <PlusIcon className="w-[18px] h-[18px]" strokeWidth={2.6} />
            </button>
            <span className="text-[13px] font-bold text-fg-muted">{product.unit}</span>
          </div>
        ) : (
          <p className="flex items-baseline gap-1.5 sm:w-28 sm:justify-end">
            <span className="text-lg font-black tabular-nums">{formatQty(product.qty)}</span>
            <span className="text-[13px] font-bold text-fg-muted">{product.unit}</span>
          </p>
        )}

        <div className="flex items-center gap-1">
          <p className="text-[15px] font-black tabular-nums sm:w-28 text-right">{formatBRL(product.qty * product.unitPrice)}</p>
          {editMode && (
            <button
              type="button"
              onClick={() => onRemove(product.id)}
              aria-label={`Remover ${product.name} da importação`}
              className="w-11 h-11 rounded-full flex items-center justify-center text-fg-muted cursor-pointer hover:text-zero hover:bg-zero/10 transition-colors"
            >
              <TrashIcon className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
