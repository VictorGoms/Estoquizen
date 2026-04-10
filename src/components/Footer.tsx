"use client";

import { useRouter } from "next/navigation";
import Logo from "./Logo";

const FOOTER_LINKS = [
  { label: "Termos de uso", href: "/termos" },
  { label: "Privacidade", href: "/privacidade" },
  { label: "Contato", href: "/contato" },
];

export default function Footer() {
  const router = useRouter();

  return (
    <footer
      className="border-t py-10"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo + name */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2.5 cursor-pointer group"
            aria-label="Estoquizen"
          >
            <Logo size={28} />
            <span className="font-display font-bold text-base text-slate-300 group-hover:text-white transition-colors duration-200">
              Estoquizen
            </span>
          </button>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => router.push(link.href)}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors duration-200 cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Estoquizen
          </p>
        </div>
      </div>
    </footer>
  );
}
