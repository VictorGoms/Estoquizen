"use client";

import { useState } from "react";

export interface ReviewProduct {
  id: string;
  code: string;
  name: string;
  unit: string;
  qty: number;
  unitPrice: number;
  status: "novo" | "existente" | "divergente";
}

const STATUS_CONFIG = {
  novo:       { label: "Novo",        bg: "rgba(29,78,216,0.15)",  text: "#93C5FD", dot: "#3B82F6" },
  existente:  { label: "Cadastrado",  bg: "rgba(5,150,105,0.15)",  text: "#6EE7B7", dot: "#10B981" },
  divergente: { label: "Divergência", bg: "rgba(217,119,6,0.15)",  text: "#FCD34D", dot: "#D97706" },
};

interface ProductReviewCardProps {
  product: ReviewProduct;
  editMode: boolean;
  onQtyChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default function ProductReviewCard({ product, editMode, onQtyChange, onRemove }: ProductReviewCardProps) {
  const [inputEditing, setInputEditing] = useState(false);
  const st = STATUS_CONFIG[product.status];
  const total = (product.qty * product.unitPrice).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div
      className="rounded-xl transition-all duration-200"
      style={{
        background: "rgba(30,41,59,0.6)",
        border: `1px solid ${product.status === "divergente" ? "rgba(217,119,6,0.2)" : "rgba(255,255,255,0.07)"}`,
      }}
    >
      {/*
        Mobile: stacked (unchanged)
        Desktop: 3-column grid — [info flex-1] [qty fixed] [total + action fixed]
      */}
      <div className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center gap-0">

        {/* ── Col 1: product info ── */}
        <div className="flex items-center gap-3 px-4 py-3.5 min-w-0">
          {/* Status dot (desktop only visual) */}
          <span
            className="hidden sm:block w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: st.dot }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="text-sm font-medium text-white truncate">{product.name}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] text-slate-600">{product.code}</span>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: st.bg, color: st.text }}
              >
                {st.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              R$ {(product.unitPrice ?? 0).toFixed(2).replace(".", ",")} / {product.unit}
            </p>
          </div>
        </div>

        {/* ── Col 2: quantity ── */}
        <div
          className="flex items-center justify-between sm:justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3.5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <span className="text-[10px] text-slate-600 sm:hidden">Qtd.</span>

          {editMode ? (
            /* Edit mode: stepper */
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onQtyChange(product.id, Math.max(1, product.qty - 1))}
                className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all duration-150 cursor-pointer"
                aria-label="Diminuir"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
              </button>

              {inputEditing ? (
                <input
                  type="number"
                  min={1}
                  value={product.qty}
                  autoFocus
                  onChange={(e) => onQtyChange(product.id, Math.max(1, Number(e.target.value)))}
                  onBlur={() => setInputEditing(false)}
                  onKeyDown={(e) => e.key === "Enter" && setInputEditing(false)}
                  className="w-12 text-center text-sm font-semibold text-white rounded-lg py-1 outline-none"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(59,130,246,0.5)" }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setInputEditing(true)}
                  className="w-12 text-center text-sm font-semibold text-white rounded-lg py-1 cursor-pointer hover:bg-white/5 transition-all duration-150"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  {product.qty}
                </button>
              )}

              <button
                type="button"
                onClick={() => onQtyChange(product.id, product.qty + 1)}
                className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all duration-150 cursor-pointer"
                aria-label="Aumentar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </button>

              <span className="text-[10px] text-slate-600 w-5">{product.unit}</span>
            </div>
          ) : (
            /* Read mode: static */
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white">{product.qty}</span>
              <span className="text-xs text-slate-600">{product.unit}</span>
            </div>
          )}
        </div>

        {/* ── Col 3: total + remove ── */}
        <div
          className="flex items-center justify-between sm:justify-end sm:gap-4 px-4 sm:px-5 py-2.5 sm:py-3.5 sm:min-w-[120px]"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <span className="text-[10px] text-slate-600 sm:hidden">Total</span>
          <p className="text-sm font-display font-bold text-white">{total}</p>

          {editMode && (
            <button
              type="button"
              onClick={() => onRemove(product.id)}
              className="text-slate-700 hover:text-rose-400 transition-colors duration-200 cursor-pointer p-1 ml-1"
              aria-label={`Remover ${product.name}`}
            >
              <TrashIcon />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
