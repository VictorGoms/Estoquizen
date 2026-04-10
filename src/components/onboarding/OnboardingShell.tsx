"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();

  return (
    <div className="min-h-screen bg-navy-900 relative overflow-hidden">
      {/* Top glow */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "800px",
          height: "450px",
          background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.14) 0%, transparent 70%)",
        }}
      />

      {/* Topbar */}
      <header
        className="fixed top-0 left-0 right-0 z-40 glass"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 cursor-pointer group"
              aria-label="Estoquizen"
            >
              <Logo size={28} />
              <span className="font-display font-bold text-base text-white group-hover:text-brand-300 transition-colors duration-200 hidden sm:block">
                Estoquizen
              </span>
            </button>

            <StepIndicator currentStep={currentStep} steps={STEPS} />

            {/* Empty spacer to balance logo */}
            <div className="w-28 hidden sm:block" />
          </div>
        </div>
      </header>

      <main className="pt-14 min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  );
}
