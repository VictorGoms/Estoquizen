interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: "blue" | "amber" | "emerald" | "slate";
  icon: React.ReactNode;
}

const ACCENTS = {
  blue:    { iconBg: "rgba(29,78,216,0.15)",  iconColor: "#60A5FA", bar: "#2563EB" },
  amber:   { iconBg: "rgba(217,119,6,0.15)",  iconColor: "#FCD34D", bar: "#D97706" },
  emerald: { iconBg: "rgba(5,150,105,0.15)",  iconColor: "#6EE7B7", bar: "#059669" },
  slate:   { iconBg: "rgba(100,116,139,0.15)", iconColor: "#94A3B8", bar: "#64748B" },
};

export default function StatCard({ label, value, sub, accent = "blue", icon }: StatCardProps) {
  const a = ACCENTS[accent];

  return (
    <div
      className="flex items-center gap-3 rounded-2xl p-4 flex-1 min-w-0"
      style={{
        background: "rgba(30,41,59,0.6)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
      }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: a.iconBg, color: a.iconColor }}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium leading-none mb-1 truncate">
          {label}
        </p>
        <p className="text-base font-display font-bold text-white leading-none">
          {value}
        </p>
        {sub && (
          <p className="text-[10px] text-slate-600 mt-0.5 truncate">{sub}</p>
        )}
      </div>
    </div>
  );
}
