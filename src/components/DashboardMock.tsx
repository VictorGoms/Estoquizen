"use client";

const BARS = [55, 80, 45, 90, 65, 78, 92];
const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const STAT_CARDS = [
  { label: "Produtos", value: "1.248", change: "+12%", up: true },
  { label: "Em estoque", value: "8.530", change: "+5%", up: true },
  { label: "Alertas", value: "3", change: "-2", up: false },
];

export default function DashboardMock() {
  return (
    <div
      className="relative w-full max-w-lg mx-auto rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.98) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
      aria-label="Prévia do painel Estoquizen"
    >
      {/* Topbar */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        <span className="ml-3 text-xs text-slate-500 font-mono">stock-precision.app</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Visão geral</p>
            <h3 className="text-base font-display font-bold text-white mt-0.5">Dashboard</h3>
          </div>
          <span className="text-xs bg-brand-600/20 text-brand-300 border border-brand-500/20 px-2.5 py-1 rounded-full font-medium">
            Ao vivo
          </span>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-2.5">
          {STAT_CARDS.map((card) => (
            <div
              key={card.label}
              className="rounded-xl p-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium truncate">{card.label}</p>
              <p className="text-base font-display font-bold text-white mt-1">{card.value}</p>
              <p className={`text-[10px] font-medium mt-0.5 ${card.up ? "text-emerald-400" : "text-rose-400"}`}>
                {card.change}
              </p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div
          className="rounded-xl p-4"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-slate-400">Movimentações / semana</p>
            <p className="text-xs text-brand-400 font-semibold">+18%</p>
          </div>
          <div className="flex items-end gap-1.5 h-20">
            {BARS.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm bar-animate"
                  style={{
                    height: `${h}%`,
                    background: i === 6
                      ? "linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)"
                      : "rgba(59,130,246,0.28)",
                    animationDelay: `${i * 80}ms`,
                  }}
                />
                <span className="text-[8px] text-slate-600">{DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="space-y-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Atividade recente</p>
          {[
            { name: "Produto A – Camiseta P", qty: "+50 un", color: "text-emerald-400" },
            { name: "Produto B – Calça Jeans", qty: "-12 un", color: "text-rose-400" },
            { name: "Produto C – Meia esportiva", qty: "+200 un", color: "text-emerald-400" },
          ].map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-lg px-3 py-2"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                <span className="text-[11px] text-slate-400 truncate max-w-[130px]">{item.name}</span>
              </div>
              <span className={`text-[11px] font-semibold ${item.color}`}>{item.qty}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
