import { CheckIcon, XIcon } from "@/components/ui/icons";
import PrecoPlano from "@/components/PrecoPlano";

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

/* Selecionado = card claro invertido (padrão "ativo" do tema). Destaque = selo azul. */
export default function PlanCard({
  name,
  price,
  priceNote,
  description,
  features,
  badge,
  trialNote,
  selected,
  onSelect,
}: PlanCardProps) {
  const muted = selected ? "text-inverse-muted" : "text-fg-muted";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative w-full h-full text-left cursor-pointer rounded-5xl p-6 flex flex-col transition-colors duration-200 ${
        selected ? "bg-inverse text-ink shadow-lift" : "bg-surface text-fg hover:bg-[#19243a]"
      }`}
    >
      {badge && (
        <span className="absolute -top-3 left-6 text-xs font-black px-3 py-1 rounded-full bg-accent text-ink">
          {badge}
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-xl font-black">{name}</h3>
          <p className={`text-sm font-bold ${muted}`}>{description}</p>
        </div>
        <span
          aria-hidden="true"
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
            selected ? "bg-ink text-accent" : "ring-2 ring-white/15"
          }`}
        >
          {selected && <CheckIcon className="w-4 h-4" strokeWidth={3} />}
        </span>
      </div>

      {trialNote ? (
        <div className="mt-5">
          <PrecoPlano price={price} priceNote={priceNote ?? ""} tamanho="text-[34px]" muted={muted} />
        </div>
      ) : (
        <div className="mt-5 flex items-baseline gap-1.5">
          <span className="text-[34px] font-black tracking-tight leading-none">{price}</span>
          {priceNote && <span className={`text-sm font-extrabold ${muted}`}>{priceNote}</span>}
        </div>
      )}

      <span className={`my-5 border-t-2 border-dashed ${selected ? "border-ink/15" : "border-white/12"}`} />

      <ul className="flex flex-col gap-3 flex-1">
        {features.map((f) => (
          <li key={f.text} className="flex items-start gap-2.5">
            {f.included ? (
              <CheckIcon className={`w-[18px] h-[18px] shrink-0 mt-px ${selected ? "text-emerald-700" : "text-ok"}`} strokeWidth={2.8} />
            ) : (
              <XIcon className={`w-[18px] h-[18px] shrink-0 mt-px ${selected ? "text-inverse-muted" : "text-fg-subtle"}`} strokeWidth={2.4} />
            )}
            <span className={`text-sm font-bold leading-snug ${f.included ? "" : `${muted} line-through`}`}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>
    </button>
  );
}
