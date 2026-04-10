export default function Divider({ label = "ou" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div
        className="flex-1 h-px"
        style={{ background: "rgba(255,255,255,0.08)" }}
      />
      <span className="text-xs text-slate-600 font-medium uppercase tracking-wider">
        {label}
      </span>
      <div
        className="flex-1 h-px"
        style={{ background: "rgba(255,255,255,0.08)" }}
      />
    </div>
  );
}
