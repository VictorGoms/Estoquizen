"use client";

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconBg?: string;
  iconColor?: string;
  onClick?: () => void;
  badge?: string;
}

const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0 text-slate-600 group-hover:text-slate-400 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

export default function ActionCard({ icon, title, description, iconBg, iconColor, onClick, badge }: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left rounded-2xl p-4 sm:p-5 flex items-center gap-4 cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
      style={{
        background: "rgba(30,41,59,0.6)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(30,41,59,0.9)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(30,41,59,0.6)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.15)";
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
        style={{
          background: iconBg ?? "rgba(29,78,216,0.15)",
          color: iconColor ?? "#60A5FA",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-sm text-white">{title}</span>
          {badge && (
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(217,119,6,0.2)", color: "#FCD34D" }}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>
      </div>

      <ArrowIcon />
    </button>
  );
}
