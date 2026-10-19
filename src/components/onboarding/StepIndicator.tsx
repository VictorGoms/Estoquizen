import { CheckIcon } from "@/components/ui/icons";

interface StepIndicatorProps {
  currentStep: 1 | 2;
  steps: { label: string }[];
}

export default function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <ol aria-label={`Etapa ${currentStep} de ${steps.length}`} className="flex items-center">
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const done    = stepNum < currentStep;
        const active  = stepNum === currentStep;

        return (
          <li key={step.label} className="flex items-center" aria-current={active ? "step" : undefined}>
            <span className="flex items-center gap-2">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-black transition-colors ${
                  done ? "bg-ok text-ink" : active ? "bg-accent text-ink" : "bg-surface-2 text-fg-subtle"
                }`}
              >
                {done ? <CheckIcon className="w-4 h-4" strokeWidth={3} /> : stepNum}
              </span>
              <span className={`hidden sm:block text-sm font-extrabold ${active ? "text-fg" : "text-fg-muted"}`}>
                {step.label}
              </span>
            </span>
            {i < steps.length - 1 && (
              <span aria-hidden="true" className={`w-8 sm:w-12 mx-2 sm:mx-3 border-t-2 border-dashed ${done ? "border-ok/60" : "border-white/15"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
