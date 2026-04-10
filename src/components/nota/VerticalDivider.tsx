interface VerticalDividerProps {
  label?: string;
}

export default function VerticalDivider({ label = "ou" }: VerticalDividerProps) {
  return (
    <>
      {/* Mobile: horizontal */}
      <div className="flex md:hidden items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
        <span className="text-xs text-slate-600 font-medium uppercase tracking-wider">{label}</span>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
      </div>

      {/* Desktop: vertical (used as grid child) */}
      <div className="hidden md:flex flex-col items-center justify-center gap-3 py-4">
        <div className="flex-1 w-px" style={{ background: "rgba(255,255,255,0.07)" }} />
        <span className="text-xs text-slate-600 font-medium uppercase tracking-wider rotate-0">{label}</span>
        <div className="flex-1 w-px" style={{ background: "rgba(255,255,255,0.07)" }} />
      </div>
    </>
  );
}
