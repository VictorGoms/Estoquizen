import type { ReactNode } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: ReactNode;
  /** Ícone opcional acima do título (telas de confirmação e convite) */
  icon?: ReactNode;
}

export default function AuthLayout({ children, title, subtitle, icon }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="flex items-center gap-2.5 mb-7 group" aria-label="Voltar para a página inicial do Estoquizen">
        <Logo size={38} />
        <span className="text-xl font-black tracking-tight text-fg group-hover:text-accent transition-colors duration-200">
          Estoquizen
        </span>
      </Link>

      <main className="w-full max-w-md bg-surface rounded-6xl p-7 sm:p-9">
        <div className={`mb-7 flex flex-col gap-2 ${icon ? "items-center text-center" : ""}`}>
          {icon && (
            <span className="w-16 h-16 rounded-full bg-surface-2 text-accent flex items-center justify-center mb-2">
              {icon}
            </span>
          )}
          <h1 className="text-[28px] font-black tracking-tight leading-tight">{title}</h1>
          <p className="text-[15px] font-bold text-fg-muted">{subtitle}</p>
        </div>
        {children}
      </main>

      <p suppressHydrationWarning className="mt-7 text-[13px] font-bold text-fg-subtle text-center">
        © {new Date().getFullYear()} Estoquizen
      </p>
    </div>
  );
}
