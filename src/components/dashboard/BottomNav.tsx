"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole, type WorkspaceRole } from "@/hooks/useRole";
import { isNavActive, NAV_SECTIONS } from "@/components/dashboard/DashboardSidebar";
import { HomeIcon, BoxIcon, ScanIcon, ChartIcon, GridIcon, XIcon } from "@/components/ui/icons";

const ALL: WorkspaceRole[]      = ["owner", "admin", "member"];
const MANAGERS: WorkspaceRole[] = ["owner", "admin"];

const NAV_ITEMS = [
  { label: "Início",   href: "/dashboard",          roles: ALL,      Icon: HomeIcon },
  { label: "Estoque",  href: "/estoque",            roles: ALL,      Icon: BoxIcon },
  { label: "Escanear", href: "/scanner",            roles: ALL,      Icon: ScanIcon, primary: true },
  { label: "Métricas", href: "/dashboard-metricas", roles: MANAGERS, Icon: ChartIcon },
];

/* O resto do menu lateral cabe no "Mais": o que entrar lá no computador aparece aqui sozinho */
const BAR_HREFS = new Set(NAV_ITEMS.map((i) => i.href));

const HINTS: Record<string, string> = {
  "/historico":     "Entradas e saídas de cada pessoa",
  "/compras":       "O que comprar, para mandar no WhatsApp",
  "/nota":          "Entrada de uma compra inteira",
  "/membros":       "Quem tem acesso ao workspace",
  "/configuracoes": "Empresa, plano e assinatura",
};

export default function BottomNav() {
  const pathname = usePathname();
  const role = useRole() ?? "member";
  const [moreOpen, setMoreOpen] = useState(false);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const closeRef   = useRef<HTMLButtonElement>(null);

  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const moreSections = NAV_SECTIONS
    .map((s) => ({ label: s.label, items: s.items.filter((i) => i.roles.includes(role) && !BAR_HREFS.has(i.href)) }))
    .filter((s) => s.items.length > 0);
  const moreActive = moreSections.some((s) => s.items.some((i) => isNavActive(pathname, i.href)));

  /* Fecha ao trocar de página */
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  /* Foco na folha ao abrir, volta para o botão ao fechar; Esc fecha; a página atrás não rola */
  useEffect(() => {
    if (!moreOpen) return;
    const btn = moreBtnRef.current;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMoreOpen(false); };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      btn?.focus();
    };
  }, [moreOpen]);

  const columns = items.length + (moreSections.length > 0 ? 1 : 0);

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="lg:hidden fixed left-3.5 right-3.5 bottom-[calc(12px+env(safe-area-inset-bottom))] z-40 max-w-lg mx-auto h-[72px] px-1.5 rounded-[30px] bg-surface shadow-nav grid items-center"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 min-h-[56px] text-[11px] transition-colors duration-200 ${
                active || item.primary ? "text-fg font-black" : "text-fg-muted font-extrabold hover:text-fg"
              }`}
            >
              {item.primary ? (
                <span className="w-14 h-14 mt-[-30px] rounded-full bg-accent text-ink border-[5px] border-ink flex items-center justify-center">
                  <item.Icon className="w-6 h-6" strokeWidth={2.2} />
                </span>
              ) : active ? (
                <span className="w-[46px] h-[30px] rounded-full bg-inverse text-ink flex items-center justify-center">
                  <item.Icon className="w-5 h-5" strokeWidth={2.2} />
                </span>
              ) : (
                <span className="h-[30px] flex items-center">
                  <item.Icon className="w-[22px] h-[22px]" />
                </span>
              )}
              {item.label}
            </Link>
          );
        })}

        {moreSections.length > 0 && (
          <button
            ref={moreBtnRef}
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={`flex flex-col items-center justify-center gap-1 min-h-[56px] text-[11px] cursor-pointer transition-colors duration-200 ${
              moreActive || moreOpen ? "text-fg font-black" : "text-fg-muted font-extrabold hover:text-fg"
            }`}
          >
            {moreActive ? (
              <span className="w-[46px] h-[30px] rounded-full bg-inverse text-ink flex items-center justify-center">
                <GridIcon className="w-5 h-5" strokeWidth={2.2} />
              </span>
            ) : (
              <span className="h-[30px] flex items-center">
                <GridIcon className="w-[22px] h-[22px]" />
              </span>
            )}
            Mais
          </button>
        )}
      </nav>

      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-60 flex items-end justify-center overscroll-contain" role="dialog" aria-modal="true" aria-labelledby="more-sheet-title">
          <button
            type="button"
            aria-label="Fechar"
            tabIndex={-1}
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-black/60 cursor-default"
          />
          <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto overscroll-contain bg-surface rounded-t-5xl px-4 pt-3 pb-[calc(20px+env(safe-area-inset-bottom))] flex flex-col gap-4 animate-fade-up">
            <span aria-hidden="true" className="mx-auto w-10 h-1.5 rounded-full bg-white/15" />
            <div className="flex items-center justify-between gap-3 px-1">
              <h2 id="more-sheet-title" className="text-xl font-black">Mais opções</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Fechar"
                className="w-11 h-11 rounded-full bg-surface-2 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
              >
                <XIcon className="w-5 h-5" strokeWidth={2.4} />
              </button>
            </div>

            {moreSections.map((section) => (
              <div key={section.label} className="flex flex-col gap-1.5">
                <p className="px-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-fg-subtle">{section.label}</p>
                <ul className="flex flex-col gap-1.5">
                  {section.items.map((item) => {
                    const active = isNavActive(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={`flex items-center gap-3.5 min-h-[60px] p-2.5 pr-4 rounded-[22px] transition-colors ${
                            active ? "bg-inverse text-ink" : "bg-surface-2 text-fg hover:bg-white/10"
                          }`}
                        >
                          <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${active ? "bg-ink text-accent" : "bg-ink text-fg-soft"}`}>
                            <item.Icon className="w-5 h-5" strokeWidth={2.2} />
                          </span>
                          <span className="flex-1 min-w-0 flex flex-col">
                            <span className="text-[15px] font-black">{item.label}</span>
                            {HINTS[item.href] && (
                              <span className={`text-[13px] font-bold truncate ${active ? "text-inverse-muted" : "text-fg-muted"}`}>{HINTS[item.href]}</span>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
