"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { getWorkspace, type WorkspaceRole } from "@/hooks/useWorkspace";
import { useRole } from "@/hooks/useRole";
import { useUser } from "@/lib/userContext";
import { personInitials } from "@/lib/stock";
import {
  HomeIcon, BoxIcon, ScanIcon, DocumentIcon, ChartIcon, UsersIcon, SlidersIcon, ChevronsUpDownIcon,
} from "@/components/ui/icons";

interface DashboardSidebarProps {
  workspaceName?: string;
  userInitials?: string;
  userName?: string;
  userEmail?: string;
}

const ALL: WorkspaceRole[]      = ["owner", "admin", "member"];
const MANAGERS: WorkspaceRole[] = ["owner", "admin"];

export const ROLE_LABEL: Record<WorkspaceRole, string> = {
  owner:  "Proprietário",
  admin:  "Administrador",
  member: "Membro",
};

const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard",          label: "Início",          roles: ALL,      Icon: HomeIcon },
      { href: "/estoque",            label: "Estoque",         roles: ALL,      Icon: BoxIcon },
      { href: "/scanner",            label: "Escanear",        roles: ALL,      Icon: ScanIcon },
      { href: "/nota",               label: "Ler nota de compra", roles: MANAGERS, Icon: DocumentIcon },
      { href: "/dashboard-metricas", label: "Métricas",        roles: MANAGERS, Icon: ChartIcon },
    ],
  },
  {
    label: "Equipe",
    items: [
      { href: "/membros",       label: "Membros",       roles: ALL,      Icon: UsersIcon },
      { href: "/configuracoes", label: "Configurações", roles: MANAGERS, Icon: SlidersIcon },
    ],
  },
];

/** "/estoque/123" também ativa "Estoque"; "/dashboard-metricas" não ativa "Início". */
export function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardSidebar({
  workspaceName: workspaceNameProp = "",
  userInitials,
  userName: userNameProp,
  userEmail: userEmailProp,
}: DashboardSidebarProps) {
  const { userName: ctxName, userEmail: ctxEmail, avatarUrl } = useUser();
  const userName  = userNameProp  ?? ctxName;
  const userEmail = userEmailProp ?? ctxEmail;
  const [wsName, setWsName] = useState(workspaceNameProp || "");
  const initials = userInitials ?? personInitials(userName || "?");
  const router   = useRouter();
  const pathname = usePathname();
  const role: WorkspaceRole = useRole() ?? "member";

  useEffect(() => {
    if (!workspaceNameProp) setWsName(getWorkspace()?.name || "");
    else setWsName(workspaceNameProp);
  }, [workspaceNameProp]);

  return (
    <aside className="hidden lg:flex flex-col fixed top-0 left-0 h-full w-64 z-50 py-3 pl-3">
      <div className="flex-1 min-h-0 bg-panel rounded-[30px] px-3 py-5 flex flex-col gap-5">
        <Link href="/" className="flex items-center gap-3 px-2 py-1 w-fit group">
          <Logo size={36} />
          <span className="text-xl font-black tracking-tight text-fg group-hover:text-accent transition-colors duration-200">
            Estoquizen
          </span>
        </Link>

        <button
          type="button"
          onClick={() => router.push("/select-workspace")}
          aria-label={`Trocar workspace: ${wsName}`}
          className="w-full flex items-center gap-3 p-2.5 rounded-[20px] bg-surface-2 text-left cursor-pointer transition-colors duration-200 hover:bg-white/10"
        >
          <span className="w-10 h-10 rounded-[14px] bg-accent text-ink text-[17px] font-black flex items-center justify-center flex-shrink-0">
            {wsName.charAt(0).toUpperCase()}
          </span>
          <span className="flex-1 min-w-0 flex flex-col gap-0.5">
            <span className="text-sm font-extrabold leading-tight line-clamp-2 break-words">{wsName}</span>
            <span className="text-xs font-bold text-fg-muted">{ROLE_LABEL[role]}</span>
          </span>
          <ChevronsUpDownIcon className="w-[18px] h-[18px] text-fg-subtle flex-shrink-0" />
        </button>

        <nav aria-label="Navegação principal" className="flex-1 min-h-0 overflow-y-auto scrollbar-none flex flex-col gap-[18px]">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="flex flex-col gap-1">
              <p className="px-3 mb-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-fg-subtle">
                {section.label}
              </p>
              {section.items.filter((item) => item.roles.includes(role)).map((item) => {
                const active = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 min-h-[46px] px-3 rounded-[18px] text-[15px] transition-colors duration-200 ${
                      active ? "bg-inverse text-ink font-extrabold" : "text-fg-muted font-bold hover:bg-white/5 hover:text-fg"
                    }`}
                  >
                    <item.Icon className="w-5 h-5 flex-shrink-0" strokeWidth={active ? 2.2 : 2} />
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <Link
          href="/perfil"
          aria-label={`Perfil de ${userName}`}
          className="flex items-center gap-3 p-2.5 rounded-[20px] transition-colors duration-200 hover:bg-white/5"
        >
          <span className="w-10 h-10 rounded-full overflow-hidden bg-surface-2 text-sm font-black flex items-center justify-center flex-shrink-0">
            {avatarUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              : initials}
          </span>
          <span className="min-w-0 flex flex-col gap-0.5">
            <span className="text-sm font-extrabold truncate">{userName}</span>
            <span className="text-xs font-bold text-fg-muted truncate">{userEmail}</span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
