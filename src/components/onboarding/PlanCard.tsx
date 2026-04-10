interface Feature {
  text: string;
  included: boolean;
}

interface PlanCardProps {
  name: string;
  price: string;
  priceNote?: string;
  description: string;
  features: Feature[];
  highlighted?: boolean;
  badge?: string;
  trialNote?: string;
  selected: boolean;
  onSelect: () => void;
}

const CheckIcon = ({ muted }: { muted?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 flex-shrink-0 ${muted ? "text-slate-600" : "text-emerald-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function PlanCard({
  name,
  price,
  priceNote,
  description,
  features,
  highlighted,
  badge,
  trialNote,
  selected,
  onSelect,
}: PlanCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="relative w-full text-left cursor-pointer rounded-2xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 flex flex-col"
      style={{
        background: highlighted
          ? selected
            ? "linear-gradient(160deg, rgba(37,99,235,0.22) 0%, rgba(29,78,216,0.14) 100%)"
            : "linear-gradient(160deg, rgba(29,78,216,0.18) 0%, rgba(15,23,42,0.9) 100%)"
          : selected
          ? "rgba(29,78,216,0.12)"
          : "rgba(30,41,59,0.55)",
        border: selected
          ? highlighted
            ? "1px solid rgba(99,152,255,0.6)"
            : "1px solid rgba(59,130,246,0.5)"
          : highlighted
          ? "1px solid rgba(59,130,246,0.28)"
          : "1px solid rgba(255,255,255,0.07)",
        boxShadow: selected
          ? highlighted
            ? "0 0 0 3px rgba(37,99,235,0.2), 0 8px 32px rgba(0,0,0,0.3)"
            : "0 0 0 3px rgba(37,99,235,0.15), 0 4px 20px rgba(0,0,0,0.2)"
          : highlighted
          ? "0 8px 32px rgba(0,0,0,0.3)"
          : "0 2px 12px rgba(0,0,0,0.15)",
        transform: highlighted && !selected ? "scale(1.01)" : undefined,
      }}
    >
      {/* Popular badge */}
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full text-white"
            style={{
              background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
              boxShadow: "0 2px 10px rgba(37,99,235,0.5)",
            }}
          >
            {badge}
          </span>
        </div>
      )}

      <div className="p-5 sm:p-6 flex flex-col h-full">
        {/* Plan header */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className={`font-display font-bold text-base ${highlighted ? "text-brand-200" : "text-white"}`}>
                {name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
            {/* Selection indicator */}
            <div className="flex-shrink-0 mt-0.5">
              {selected ? (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg,#059669,#10B981)",
                    boxShadow: "0 2px 8px rgba(16,185,129,0.5)",
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ border: "1.5px solid rgba(255,255,255,0.15)" }}
                />
              )}
            </div>
          </div>

          {/* Price */}
          <div className="mt-3 flex items-baseline gap-1">
            <span className={`font-display font-extrabold text-2xl ${highlighted ? "text-white" : "text-white"}`}>
              {price}
            </span>
            {priceNote && (
              <span className="text-xs text-slate-500 font-medium">{priceNote}</span>
            )}
          </div>
          {trialNote && (
            <span
              className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(16,185,129,0.15)", color: "#34D399" }}
            >
              {trialNote}
            </span>
          )}
        </div>

        {/* Divider */}
        <div
          className="mb-4 h-px"
          style={{
            background: highlighted
              ? "rgba(59,130,246,0.2)"
              : "rgba(255,255,255,0.06)",
          }}
        />

        {/* Features */}
        <ul className="flex flex-col gap-2.5 flex-1">
          {features.map((f) => (
            <li key={f.text} className="flex items-center gap-2.5">
              {f.included ? <CheckIcon muted={!highlighted && !selected} /> : <XIcon />}
              <span
                className={`text-xs leading-snug ${
                  f.included
                    ? highlighted
                      ? "text-slate-300"
                      : "text-slate-400"
                    : "text-slate-700 line-through"
                }`}
              >
                {f.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </button>
  );
}
