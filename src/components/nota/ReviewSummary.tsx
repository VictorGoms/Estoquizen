interface ReviewSummaryProps {
  totalItems: number;
  totalQty: number;
  totalValue: number;
  newCount: number;
  existingCount: number;
  divergentCount: number;
}

export default function ReviewSummary({
  totalItems,
  totalQty,
  totalValue,
  newCount,
  existingCount,
  divergentCount,
}: ReviewSummaryProps) {
  const fmtCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div
      className="rounded-2xl p-5 sm:p-6 flex flex-col gap-4"
      style={{
        background: "rgba(22,32,52,0.8)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
      }}
    >
      <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium">
        Resumo da importação
      </p>

      {/* Main numbers */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Itens", value: totalItems, sub: "produtos" },
          { label: "Quantidade", value: totalQty, sub: "unidades" },
          { label: "Valor total", value: fmtCurrency(totalValue), sub: "na NF-e" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-3 text-center"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">{s.label}</p>
            <p className="font-display font-bold text-white text-base mt-1 leading-none">{s.value}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div
        className="flex flex-col gap-2 pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        {[
          { label: "Novos produtos", count: newCount, color: "#60A5FA", bg: "rgba(59,130,246,0.12)" },
          { label: "Já cadastrados", count: existingCount, color: "#6EE7B7", bg: "rgba(16,185,129,0.12)" },
          { label: "Com divergência", count: divergentCount, color: "#FCD34D", bg: "rgba(217,119,6,0.12)" },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: row.color }} />
              <span className="text-xs text-slate-500">{row.label}</span>
            </div>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: row.bg, color: row.color }}
            >
              {row.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
