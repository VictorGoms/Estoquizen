"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole, type WorkspaceRole } from "@/hooks/useRole";
import { isNavActive } from "@/components/dashboard/DashboardSidebar";
import { HomeIcon, BoxIcon, ScanIcon, ChartIcon, UsersIcon } from "@/components/ui/icons";

const ALL: WorkspaceRole[]      = ["owner", "admin", "member"];
const MANAGERS: WorkspaceRole[] = ["owner", "admin"];

/* Configurações saiu do menu inferior: fica no Perfil (e no menu lateral do computador) */
const NAV_ITEMS = [
  { label: "Início",   href: "/dashboard",          roles: ALL,      Icon: HomeIcon },
  { label: "Estoque",  href: "/estoque",            roles: ALL,      Icon: BoxIcon },
  { label: "Escanear", href: "/scanner",            roles: ALL,      Icon: ScanIcon, primary: true },
  { label: "Métricas", href: "/dashboard-metricas", roles: MANAGERS, Icon: ChartIcon },
  { label: "Equipe",   href: "/membros",            roles: ALL,      Icon: UsersIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const role = useRole() ?? "member";
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <nav
      aria-label="Navegação principal"
      className="lg:hidden fixed left-3.5 right-3.5 bottom-[calc(12px+env(safe-area-inset-bottom))] z-40 max-w-lg mx-auto h-[72px] px-1.5 rounded-[30px] bg-surface shadow-nav grid items-center"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
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
    </nav>
  );
}
