"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { getWorkspace } from "@/hooks/useWorkspace";
import { useAlertCount } from "@/hooks/useAlertCount";
import { useUser } from "@/lib/userContext";
import { personInitials } from "@/lib/stock";
import { BellIcon, ChevronDownIcon, SearchIcon } from "@/components/ui/icons";

interface DashboardTopBarProps {
  workspaceName?: string;
  userInitials?: string;
  userName?: string;
}

export default function DashboardTopBar({ workspaceName: workspaceNameProp = "", userName: userNameProp }: DashboardTopBarProps) {
  const { userName: ctxName, avatarUrl } = useUser();
  const userName = userNameProp ?? ctxName;
  const [wsName, setWsName] = useState(workspaceNameProp || "");
  const [query, setQuery]   = useState("");
  const router     = useRouter();
  const pathname   = usePathname();
  const alertCount = useAlertCount();
  const initials   = personInitials(userName || "?");

  useEffect(() => {
    if (!workspaceNameProp) setWsName(getWorkspace()?.name || "");
    else setWsName(workspaceNameProp);
  }, [workspaceNameProp]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/estoque?busca=${encodeURIComponent(q)}` : "/estoque");
  }

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 z-40 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">

        {/* Celular: logo + troca de workspace */}
        <button
          type="button"
          onClick={() => router.push("/select-workspace")}
          aria-label={`Trocar workspace: ${wsName}`}
          className="lg:hidden flex items-center gap-2.5 min-w-0 min-h-[44px] cursor-pointer group"
        >
          <Logo size={30} />
          <span className="min-w-0 text-left">
            <span className="block text-[11px] font-extrabold text-fg-subtle leading-none mb-0.5">Workspace</span>
            <span className="flex items-center gap-1 text-[15px] font-black leading-tight">
              <span className="truncate max-w-[170px] sm:max-w-[260px] group-hover:text-accent transition-colors">{wsName}</span>
              <ChevronDownIcon className="w-4 h-4 text-fg-subtle flex-shrink-0" />
            </span>
          </span>
        </button>

        {/* Computador: busca rápida (leva para o Estoque) */}
        {pathname !== "/estoque" ? (
          <form onSubmit={handleSearch} role="search" className="hidden lg:flex items-center gap-2.5 h-11 w-[340px] max-w-full px-4 rounded-full bg-surface text-fg-subtle focus-within:ring-2 focus-within:ring-accent">
            <SearchIcon className="w-[18px] h-[18px] flex-shrink-0" />
            <input
              type="search"
              name="busca"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar produto ou código"
              placeholder="Buscar produto ou código"
              className="flex-1 min-w-0 bg-transparent text-fg text-sm font-semibold outline-none placeholder:text-fg-subtle"
            />
          </form>
        ) : (
          <span className="hidden lg:block" />
        )}

        <div className="flex items-center gap-2.5">
          <Link
            href="/notificacoes"
            aria-label={alertCount > 0 ? `Notificações: ${alertCount} alertas` : "Notificações"}
            className="relative w-11 h-11 rounded-full bg-surface text-fg flex items-center justify-center transition-colors duration-200 hover:bg-surface-2"
          >
            <BellIcon className="w-[21px] h-[21px]" />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-zero text-ink text-[11px] font-black flex items-center justify-center">
                {alertCount > 99 ? "99+" : alertCount}
              </span>
            )}
          </Link>
          <Link
            href="/perfil"
            aria-label={`Conta de ${userName}`}
            className="w-11 h-11 rounded-full overflow-hidden bg-surface-2 text-sm font-black flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-105"
          >
            {avatarUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              : initials}
          </Link>
        </div>
      </div>
    </header>
  );
}
