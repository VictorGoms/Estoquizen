"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "./Logo";
import { MenuIcon, XIcon } from "@/components/ui/icons";

const NAV_LINKS = [
  { label: "Recursos",      href: "#recursos" },
  { label: "Como funciona", href: "#como-funciona" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50 pt-3">
      <div className="lp-container">
      <div
        className={`rounded-[28px] transition-colors duration-300 ${
          scrolled || menuOpen ? "bg-panel/95 shadow-lift backdrop-blur" : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between h-16 3xl:h-[76px] pl-3 pr-2 sm:pl-4">
          <Link href="#home" className="flex items-center gap-2.5 group" aria-label="Estoquizen — início da página">
            <Logo size={34} />
            <span className="text-lg font-black tracking-tight text-fg group-hover:text-accent transition-colors duration-200">
              Estoquizen
            </span>
          </Link>

          <nav aria-label="Seções" className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="min-h-[44px] flex items-center px-4 rounded-full text-[15px] 3xl:text-base font-extrabold text-fg-muted hover:text-fg hover:bg-white/5 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/login" className="min-h-[44px] 3xl:min-h-[52px] flex items-center px-5 3xl:px-6 rounded-full bg-surface text-[15px] 3xl:text-base font-extrabold hover:bg-surface-2 transition-colors">
              Entrar
            </Link>
            <Link href="/register" className="min-h-[44px] 3xl:min-h-[52px] flex items-center px-5 3xl:px-6 rounded-full bg-accent text-ink text-[15px] 3xl:text-base font-black hover:brightness-110 transition-[filter]">
              Começar grátis
            </Link>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <Link href="/login" className="min-h-[44px] flex items-center px-4 rounded-full bg-surface text-sm font-extrabold">
              Entrar
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              aria-controls="landing-menu"
              className="w-11 h-11 rounded-full bg-surface text-fg flex items-center justify-center cursor-pointer"
            >
              {menuOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div id="landing-menu" className="md:hidden px-3 pb-3 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="min-h-[48px] flex items-center px-4 rounded-2xl text-[15px] font-extrabold text-fg-soft hover:bg-white/5"
              >
                {link.label}
              </a>
            ))}
            <Link href="/register" className="mt-1 min-h-[52px] flex items-center justify-center rounded-full bg-accent text-ink text-base font-black">
              Começar grátis
            </Link>
          </div>
        )}
      </div>
      </div>
    </header>
  );
}
