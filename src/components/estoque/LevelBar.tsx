import type { StockStatus } from "@/lib/stock";

const FILL_DARK: Record<StockStatus, string>  = { normal: "bg-ok", baixo: "bg-low", zerado: "bg-zero" };
const FILL_LIGHT: Record<StockStatus, string> = { normal: "bg-emerald-600", baixo: "bg-amber-700", zerado: "bg-rose-700" };

interface LevelBarProps {
  /** fração preenchida, 0–1 (ver stockLevel em lib/stock) */
  fill: number;
  status: StockStatus;
  /** posição do estoque mínimo, 0–1; mostra um marcador */
  minMark?: number;
  thick?: boolean;
  onLight?: boolean;
}

/** Barra de nível do estoque. Decorativa: a quantidade sempre aparece em texto ao lado. */
export default function LevelBar({ fill, status, minMark, thick = false, onLight = false }: LevelBarProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative w-full rounded-full ${thick ? "h-2.5" : "h-1.5"} ${onLight ? "bg-inverse-line" : "bg-ink"}`}
    >
      {fill > 0 && (
        <div
          className={`h-full rounded-full ${(onLight ? FILL_LIGHT : FILL_DARK)[status]}`}
          style={{ width: `${Math.max(fill * 100, 4)}%` }}
        />
      )}
      {minMark !== undefined && minMark > 0 && (
        <span
          className="absolute -top-1 w-[3px] h-[18px] rounded-sm bg-inverse"
          style={{ left: `calc(${minMark * 100}% - 1.5px)` }}
        />
      )}
    </div>
  );
}
