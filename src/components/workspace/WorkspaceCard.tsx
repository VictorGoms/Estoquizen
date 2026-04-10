const ROLE_STYLES: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  owner: {
    label: "Owner",
    bg: "rgba(217,119,6,0.18)",
    text: "#FCD34D",
    dot: "#F59E0B",
  },
  admin: {
    label: "Administrador",
    bg: "rgba(29,78,216,0.15)",
    text: "#93C5FD",
    dot: "#3B82F6",
  },
  member: {
    label: "Membro",
    bg: "rgba(5,150,105,0.15)",
    text: "#6EE7B7",
    dot: "#10B981",
  },
};

interface WorkspaceCardProps {
  name: string;
  role: keyof typeof ROLE_STYLES;
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
  const roleStyle = ROLE_STYLES[role] ?? ROLE_STYLES.operator;
  const initial = name.charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="w-full text-left cursor-pointer transition-all duration-200 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
      style={{
        background: selected
          ? "rgba(29,78,216,0.12)"
          : "rgba(30,41,59,0.6)",
        border: selected
          ? "1px solid rgba(59,130,246,0.5)"
          : "1px solid rgba(255,255,255,0.07)",
        boxShadow: selected
          ? "0 0 0 3px rgba(37,99,235,0.15), 0 4px 20px rgba(0,0,0,0.2)"
          : "0 2px 12px rgba(0,0,0,0.15)",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.background = "rgba(30,41,59,0.85)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.13)";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.25)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.background = "rgba(30,41,59,0.6)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.15)";
        }
      }}
    >
      <div className="flex items-center gap-4 p-4 sm:p-5">
        {/* Workspace avatar */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-display font-bold text-white flex-shrink-0"
          style={{
            background: selected
              ? "linear-gradient(135deg, #1d4ed8, #3b82f6)"
              : "linear-gradient(135deg, rgba(30,41,59,1), rgba(51,65,85,1))",
            border: selected
              ? "1px solid rgba(59,130,246,0.4)"
              : "1px solid rgba(255,255,255,0.08)",
            boxShadow: selected ? "0 4px 16px rgba(37,99,235,0.35)" : undefined,
          }}
        >
          {initial}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-semibold text-white text-sm truncate">
              {name}
            </span>
            {/* Role badge */}
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0"
              style={{ background: roleStyle.bg, color: roleStyle.text }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: roleStyle.dot }}
              />
              {roleStyle.label}
            </span>
          </div>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>
          )}
          {memberCount !== undefined && (
            <p className="text-[11px] text-slate-600 mt-0.5">
              {memberCount} {memberCount === 1 ? "membro" : "membros"}
            </p>
          )}
        </div>

        {/* Selection indicator */}
        <div className="flex-shrink-0">
          {selected ? (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #059669, #10B981)",
                boxShadow: "0 2px 8px rgba(16,185,129,0.5)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div
              className="w-5 h-5 rounded-full"
              style={{ border: "1.5px solid rgba(255,255,255,0.18)" }}
            />
          )}
        </div>
      </div>
    </button>
  );
}
