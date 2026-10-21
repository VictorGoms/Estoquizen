import Link from "next/link";
import Logo from "./Logo";
import { CONTATO, PRAZO_RESPOSTA } from "@/lib/site";

const LINKS = [
  { label: "Recursos",      href: "#recursos" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Preços",        href: "#precos" },
  { label: "Perguntas",     href: "#perguntas" },
  { label: "Termos",        href: "/termos" },
  { label: "Privacidade",   href: "/privacidade" },
  { label: "Licenças",      href: "/licencas" },
  { label: "Entrar",        href: "/login" },
];

export default function Footer() {
  return (
    <footer className="pb-10 pt-4">
      <div className="lp-container">
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
        {/* Contato com prazo de resposta (EQZ-47, decisão do João em 2026-10-21) */}
        <p className="mt-4 px-4 text-center text-sm font-bold text-fg-muted">
          Dúvidas? Escreva para{" "}
          <a href={`mailto:${CONTATO}`} className="text-accent font-extrabold underline-offset-2 hover:underline">{CONTATO}</a>
          {" "}· respondemos em até {PRAZO_RESPOSTA}.
        </p>
      </div>
    </footer>
  );
}
