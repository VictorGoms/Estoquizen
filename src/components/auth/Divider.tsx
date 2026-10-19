export default function Divider({ label = "ou" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <span className="flex-1 border-t-2 border-dashed border-white/10" />
      <span className="text-[13px] font-extrabold text-fg-subtle">{label}</span>
      <span className="flex-1 border-t-2 border-dashed border-white/10" />
    </div>
  );
}
