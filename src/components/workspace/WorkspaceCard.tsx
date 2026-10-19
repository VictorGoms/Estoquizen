import { CheckIcon } from "@/components/ui/icons";

const ROLE_LABEL: Record<string, string> = {
  owner:  "Proprietário",
  admin:  "Administrador",
  member: "Membro",
};

interface WorkspaceCardProps {
  name: string;
  role: string;
  description?: string;
  memberCount?: number;
  selected: boolean;
  onSelect: () => void;
}

export default function WorkspaceCard({
  name,
  role,
  description,
  memberCount,
  selected,
  onSelect,
}: WorkspaceCardProps) {
  const muted = selected ? "text-inverse-muted" : "text-fg-muted";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full text-left cursor-pointer rounded-4xl p-4 sm:p-5 flex items-center gap-4 transition-colors duration-200 ${
        selected ? "bg-inverse text-ink shadow-lift" : "bg-surface text-fg hover:bg-[#19243a]"
      }`}
    >
      <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 ${selected ? "bg-ink text-accent" : "bg-accent text-ink"}`}>
        {name.charAt(0).toUpperCase()}
      </span>

      <span className="flex-1 min-w-0 flex flex-col gap-1">
        <span className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-black truncate">{name}</span>
          <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${selected ? "bg-ink/10" : "bg-surface-2 text-fg-soft"}`}>
            {ROLE_LABEL[role] ?? role}
          </span>
        </span>
        {description && <span className={`text-sm font-bold truncate ${muted}`}>{description}</span>}
        {memberCount !== undefined && (
          <span className={`text-[13px] font-bold ${muted}`}>
            {memberCount} {memberCount === 1 ? "membro" : "membros"}
          </span>
        )}
      </span>

      <span
        aria-hidden="true"
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${selected ? "bg-ink text-accent" : "ring-2 ring-white/15"}`}
      >
        {selected && <CheckIcon className="w-4 h-4" strokeWidth={3} />}
      </span>
    </button>
  );
}
