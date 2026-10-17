import Link from "next/link";
import Logo from "@/components/Logo";
import StepIndicator from "./StepIndicator";

const STEPS = [
  { label: "Empresa" },
  { label: "Plano" },
];

interface OnboardingShellProps {
  children: React.ReactNode;
  currentStep: 1 | 2;
}

export default function OnboardingShell({ children, currentStep }: OnboardingShellProps) {
  return (
    <div className="min-h-screen bg-ink">
      <header className="fixed top-0 inset-x-0 z-40 glass">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="Estoquizen — página inicial">
            <Logo size={32} />
            <span className="hidden sm:block text-lg font-black tracking-tight text-fg group-hover:text-accent transition-colors">
              Estoquizen
            </span>
          </Link>
          <StepIndicator currentStep={currentStep} steps={STEPS} />
          <span className="w-8 sm:w-32" aria-hidden="true" />
        </div>
      </header>

      <main className="pt-16 min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  );
}
