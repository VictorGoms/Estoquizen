import { STATUS_LABEL, type StockStatus } from "@/lib/stock";

const ON_DARK: Record<StockStatus, { chip: string; dot: string }> = {
  normal: { chip: "bg-ok/15 text-ok",     dot: "bg-ok" },
  baixo:  { chip: "bg-low/15 text-low",   dot: "bg-low" },
  zerado: { chip: "bg-zero/15 text-zero", dot: "bg-zero" },
};

/* Sobre o card claro (selecionado) as cores escurecem para manter o contraste */
const ON_LIGHT: Record<StockStatus, { chip: string; dot: string }> = {
  normal: { chip: "bg-emerald-200 text-emerald-900", dot: "bg-emerald-700" },
  baixo:  { chip: "bg-amber-200 text-amber-900",     dot: "bg-amber-700" },
  zerado: { chip: "bg-rose-200 text-rose-900",       dot: "bg-rose-700" },
};

interface StatusChipProps {
  status: StockStatus;
  onLight?: boolean;
  size?: "sm" | "md";
}

export default function StatusChip({ status, onLight = false, size = "md" }: StatusChipProps) {
  const c = (onLight ? ON_LIGHT : ON_DARK)[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-black flex-shrink-0 ${
        size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1"
      } ${c.chip}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}
