"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "./Logo";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Sobre", href: "#beneficios" },
  { label: "Contato", href: "/contato" },
];

export default function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleNav(href: string) {
    setMenuOpen(false);
    if (href.startsWith("/")) {
      router.push(href);
    } else {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass shadow-glass" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <button
            onClick={() => handleNav("#home")}
            className="flex items-center gap-2.5 cursor-pointer group"
            aria-label="Estoquizen — página inicial"
          >
            <Logo />
            <span className="font-display font-bold text-lg tracking-tight text-white group-hover:text-brand-300 transition-colors duration-200">
              Estoquizen
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNav(link.href)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => router.push("/login")}
              className="btn-secondary !px-5 !py-2 !text-sm"
            >
              Entrar
            </button>
            <button
              onClick={() => router.push("/register")}
              className="btn-primary !px-5 !py-2 !text-sm"
            >
              Começar grátis
            </button>
          </div>

          {/* Mobile: Entrar + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => router.push("/login")}
              className="btn-secondary !px-4 !py-1.5 !text-xs"
            >
              Entrar
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
            >
              {menuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          menuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="glass border-t border-white/5 px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNav(link.href)}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => { setMenuOpen(false); router.push("/register"); }}
            className="btn-primary mt-2 w-full justify-center"
          >
            Começar grátis
          </button>
        </div>
      </div>
    </header>
  );
}
