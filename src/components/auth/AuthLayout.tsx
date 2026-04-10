"use client";

import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glows */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "800px",
          height: "500px",
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.2) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 w-96 h-96 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(29,78,216,0.1) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Logo */}
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-2.5 mb-8 cursor-pointer group"
        aria-label="Voltar para Estoquizen"
      >
        <Logo size={36} />
        <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-brand-300 transition-colors duration-200">
          Estoquizen
        </span>
      </button>

      {/* Card */}
      <div
        className="w-full max-w-md rounded-2xl p-8 sm:p-10"
        style={{
          background: "rgba(22, 32, 52, 0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.03)",
        }}
      >
        {/* Card header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl text-white">{title}</h1>
          <p className="text-slate-400 text-sm mt-1.5">{subtitle}</p>
        </div>

        {children}
      </div>

      {/* Footer note */}
      <p className="mt-8 text-xs text-slate-600 text-center">
        © {new Date().getFullYear()} Estoquizen. Todos os direitos reservados.
      </p>
    </div>
  );
}
