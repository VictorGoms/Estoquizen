"use client";

import Link from "next/link";
import type { Product } from "@/hooks/useProducts";
import ProductAvatar from "@/components/estoque/ProductAvatar";
import StatusChip from "@/components/estoque/StatusChip";
import LevelBar from "@/components/estoque/LevelBar";
import MovementForm from "@/components/estoque/MovementForm";
import { PencilIcon, ArrowRightIcon } from "@/components/ui/icons";
import { deriveStatus, formatBRL, formatQty, stockLevel, formatPrevisao } from "@/lib/stock";

interface ProductPanelProps {
  product: Product;
  /** Dias até acabar pela média de saídas (EQZ-16); null sem histórico suficiente */
  previsao?: number | null;
  canEdit: boolean;
  onMoved: (newQty: number, delta: number) => void;
}

/** Painel lateral do estoque no computador: detalhes do produto selecionado + entrada/saída. */
export default function ProductPanel({ product, previsao = null, canEdit, onMoved }: ProductPanelProps) {
  const status = deriveStatus(product.qty, product.min_qty ?? 0);
  const level  = stockLevel(product.qty, product.min_qty ?? 0, product.max_qty);

  const info: Array<[string, string]> = [
    ["Preço unitário", formatBRL(product.price)],
    ["Valor em estoque", formatBRL(product.qty * product.price)],
  ];
  if (previsao !== null) info.unshift(["Previsão", formatPrevisao(previsao)]);
  if (product.location) info.push(["Localização", product.location]);
  if (product.supplier) info.push(["Fornecedor", product.supplier]);

  return (
    <aside aria-label="Detalhes do produto" className="bg-surface rounded-5xl p-6 flex flex-col gap-[18px]">
      <div className="flex items-center gap-3.5">
        <ProductAvatar name={product.name} imageUrl={product.image_url} icon={product.icon} size="lg" />
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <h2 className="text-[21px] font-black leading-tight">{product.name}</h2>
          <span className="text-[13px] font-bold text-fg-muted tracking-wide truncate">{product.code}</span>
        </div>
        <Link
          href={`/estoque/${product.id}`}
          aria-label="Editar produto"
          className="w-11 h-11 rounded-full bg-surface-2 text-fg flex items-center justify-center shrink-0 hover:bg-white/10 transition-colors"
        >
          <PencilIcon className="w-[18px] h-[18px]" />
        </Link>
      </div>

      <div className="bg-surface-2 rounded-3xl p-[18px] flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-extrabold text-fg-muted">Em estoque</span>
            <span>
              <span className="text-[44px] font-black tracking-tight leading-none">{formatQty(product.qty)}</span>{" "}
              <span className="text-lg font-extrabold text-fg-muted">{product.unit}</span>
            </span>
          </div>
          <StatusChip status={status} />
        </div>
        <LevelBar fill={level.fill} status={status} minMark={level.minMark} thick />
        <div className="flex justify-between text-[13px] font-extrabold text-fg-muted">
          <span>Mínimo {formatQty(product.min_qty ?? 0)} {product.unit}</span>
          {product.max_qty ? <span>Máximo {formatQty(product.max_qty)} {product.unit}</span> : null}
        </div>
      </div>

      {canEdit ? (
        <MovementForm key={product.id} product={product} onDone={onMoved} />
      ) : (
        <p className="text-sm font-bold text-fg-muted bg-surface-2 rounded-2xl p-4">
          Seu papel neste workspace é de leitura: entradas e saídas ficam com donos e administradores.
        </p>
      )}

      <div className="flex flex-col">
        {info.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 py-3 border-t-2 border-dashed border-white/8 text-sm">
            <span className="font-bold text-fg-muted">{label}</span>
            <span className="font-extrabold text-right">{value}</span>
          </div>
        ))}
      </div>

      <Link
        href={`/estoque/${product.id}`}
        className="flex items-center justify-center gap-2 min-h-[48px] rounded-full bg-surface-2 text-fg text-[15px] font-extrabold hover:bg-white/10 transition-colors"
      >
        Ver histórico e editar
        <ArrowRightIcon className="w-[18px] h-[18px]" />
      </Link>
    </aside>
  );
}
