/**
 * Regras e formatação de estoque compartilhadas pelas telas (dashboard, estoque, scanner).
 */

export type StockStatus = "normal" | "baixo" | "zerado";

export const STATUS_LABEL: Record<StockStatus, string> = {
  normal: "Normal",
  baixo:  "Baixo",
  zerado: "Zerado",
};

/** Mesma regra da lista de estoque e das notificações: zerado ou abaixo/igual ao mínimo. */
export function deriveStatus(qty: number, minQty: number): StockStatus {
  if (qty <= 0)      return "zerado";
  if (qty <= minQty) return "baixo";
  return "normal";
}

/** Quantidade em pt-BR, até 3 casas (o banco guarda numeric(12,3)). */
export function formatQty(qty: number): string {
  return qty.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** "Feijão carioca 1kg" → "Fe" — usado no círculo quando o produto não tem foto. */
export function productInitials(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? "";
  if (!first) return "?";
  return first.charAt(0).toUpperCase() + first.slice(1, 2).toLowerCase();
}

/** "João Victor Silva" → "JV" */
export function personInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
}

/*
 * Número digitado no formato brasileiro: com vírgula, o ponto é separador de milhar
 * ("1.234,5" → 1234.5); sem vírgula, o ponto é decimal ("2.5" → 2.5). Texto com letras é
 * inválido (parseFloat aceitava "2abc" como 2).
 */
function parseDecimalBR(value: string): number {
  const s = value.trim();
  const norm = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  return /^(\d+\.?\d*|\.\d+)$/.test(norm) ? Number(norm) : NaN;
}

/** Converte o texto digitado ("1,5", "2") em número com até 3 casas. NaN se inválido. */
export function parseQtyInput(value: string): number {
  const n = parseDecimalBR(value);
  return Number.isFinite(n) ? Math.round(n * 1000) / 1000 : NaN;
}

/** Converte o preço digitado ("1.234,56", "12,5") em número com 2 casas. NaN se inválido. */
export function parsePriceInput(value: string): number {
  const n = parseDecimalBR(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

/**
 * Referência da barra de nível: o máximo cadastrado ou, sem ele, o dobro do mínimo.
 * Retorna a fração preenchida (0–1) e a posição do marcador de mínimo.
 */
export function stockLevel(qty: number, minQty: number, maxQty: number | null) {
  const ref = maxQty && maxQty > 0 ? maxQty : Math.max(minQty * 2, qty, 1);
  return {
    fill: Math.min(Math.max(qty / ref, 0), 1),
    minMark: Math.min(Math.max(minQty / ref, 0), 1),
  };
}

/** "há 12 min", "há 3 h", "ontem", "12/10" — `now` vem de estado (nunca Date.now() no render). */
export function timeAgo(iso: string, now: number): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1)  return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1)  return "ontem";
  if (d < 7)    return `há ${d} dias`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
