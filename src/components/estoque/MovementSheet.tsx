"use client";

import { useEffect, useRef } from "react";
import ProductAvatar from "@/components/estoque/ProductAvatar";
import MovementForm, { type MovementProduct } from "@/components/estoque/MovementForm";
import { XIcon } from "@/components/ui/icons";

interface SheetProduct extends MovementProduct {
  name: string;
  image_url: string | null;
  icon?: string | null;
}

interface MovementSheetProps {
  product: SheetProduct | null;
  onClose: () => void;
  onDone: (newQty: number, delta: number) => void;
}

/** Folha inferior (celular) para entrada/saída rápida a partir da lista de estoque. */
export default function MovementSheet({ product, onClose, onDone }: MovementSheetProps) {
  const closeRef   = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const isOpen = product !== null;

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  /* Foco vai para a folha ao abrir e volta para quem a abriu ao fechar; Esc fecha.
     Depende só de isOpen: re-renders do pai não podem roubar o foco do campo. */
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [isOpen]);

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center overscroll-contain" role="dialog" aria-modal="true" aria-labelledby="movement-sheet-title">
      <button
        type="button"
        aria-label="Fechar"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 cursor-default"
      />
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto overscroll-contain bg-surface rounded-t-5xl px-5 pt-3 pb-[calc(20px+env(safe-area-inset-bottom))] flex flex-col gap-4 animate-fade-up">
        <span aria-hidden="true" className="mx-auto w-10 h-1.5 rounded-full bg-white/15" />
        <div className="flex items-center gap-3">
          <ProductAvatar name={product.name} imageUrl={product.image_url} icon={product.icon} />
          <div className="flex-1 min-w-0">
            <h2 id="movement-sheet-title" className="text-[17px] font-black truncate">{product.name}</h2>
            <p className="text-[13px] font-bold text-fg-muted">Registrar entrada ou saída</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-surface-2 text-fg flex items-center justify-center shrink-0 cursor-pointer hover:bg-white/10"
          >
            <XIcon />
          </button>
        </div>
        <MovementForm key={product.id} product={product} onDone={onDone} />
      </div>
    </div>
  );
}
