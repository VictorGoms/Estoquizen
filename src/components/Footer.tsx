import Link from "next/link";
import Logo from "./Logo";

const LINKS = [
  { label: "Recursos",      href: "#recursos" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Entrar",        href: "/login" },
];

export default function Footer() {
  return (
    <footer className="pb-10 pt-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-panel rounded-5xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-5">
          <Link href="#home" className="flex items-center gap-2.5 group" aria-label="Estoquizen — início da página">
            <Logo size={30} />
            <span className="text-base font-black text-fg group-hover:text-accent transition-colors">Estoquizen</span>
          </Link>
          <nav aria-label="Rodapé" className="flex flex-wrap items-center justify-center gap-1">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="min-h-[44px] flex items-center px-3.5 rounded-full text-sm font-extrabold text-fg-muted hover:text-fg hover:bg-white/5 transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="text-[13px] font-bold text-fg-subtle">© 2026 Estoquizen</p>
        </div>
      </div>
    </footer>
  );
}
