interface StepIndicatorProps {
  currentStep: 1 | 2;
  steps: { label: string }[];
}

export default function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const done = stepNum < currentStep;
        const active = stepNum === currentStep;

        return (
          <div key={step.label} className="flex items-center">
            {/* Circle */}
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{
                  background: done
                    ? "linear-gradient(135deg,#059669,#10B981)"
                    : active
                    ? "linear-gradient(135deg,#1d4ed8,#3b82f6)"
                    : "rgba(255,255,255,0.06)",
                  border: done || active ? "none" : "1px solid rgba(255,255,255,0.12)",
                  boxShadow: active ? "0 2px 12px rgba(37,99,235,0.5)" : done ? "0 2px 8px rgba(16,185,129,0.3)" : undefined,
                }}
              >
                {done ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className={`text-[11px] font-bold ${active ? "text-white" : "text-slate-600"}`}>
                    {stepNum}
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? "text-white" : done ? "text-slate-500" : "text-slate-600"}`}>
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {i < steps.length - 1 && (
              <div
                className="w-8 sm:w-12 h-px mx-2 sm:mx-3 transition-all duration-500"
                style={{
                  background: done
                    ? "rgba(16,185,129,0.5)"
                    : "rgba(255,255,255,0.08)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
