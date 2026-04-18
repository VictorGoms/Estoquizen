"use client";

import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { getWorkspace } from "@/hooks/useWorkspace";
import { useAlertCount } from "@/hooks/useAlertCount";
import { useUser } from "@/lib/userContext";

interface DashboardTopBarProps {
  workspaceName?: string;
  userInitials?: string;
  userName?: string;
}

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
}

export default function DashboardTopBar({ workspaceName: workspaceNameProp = "", userName: userNameProp }: DashboardTopBarProps) {
  const { userName: ctxName, avatarUrl } = useUser();
  const userName = userNameProp ?? ctxName;
  const workspaceName = workspaceNameProp || getWorkspace()?.name || "";
  const router = useRouter();
  const alertCount = useAlertCount();
  const initials = getInitials(userName || "?");

  return (
    <header
      className="fixed top-0 left-0 lg:left-60 right-0 z-40 glass"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Left: workspace switcher (mobile) / page title (desktop) */}
          <div className="min-w-0">
            <button
              onClick={() => router.push("/select-workspace")}
              className="lg:hidden flex items-center gap-2.5 cursor-pointer group min-w-0"
              aria-label="Trocar workspace"
            >
              <Logo size={26} />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-600 uppercase tracking-widest leading-none mb-0.5">
                  Workspace ativo
                </p>
                <p className="text-sm font-display font-semibold text-white group-hover:text-brand-300 transition-colors duration-200 truncate max-w-[140px] sm:max-w-[200px]">
                  {workspaceName}
                </p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden lg:block">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest leading-none mb-0.5">
                Workspace ativo
              </p>
              <p className="text-sm font-display font-semibold text-white truncate">
                {workspaceName}
              </p>
            </div>
          </div>

          {/* Right: bell + avatar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/notificacoes")}
              className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer"
              aria-label="Notificações"
            >
              <BellIcon />
              {alertCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: "#EF4444", boxShadow: "0 0 6px rgba(239,68,68,0.6)" }}
                >
                  {alertCount > 99 ? "99+" : alertCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push("/perfil")}
              className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-110"
              style={{
                background: avatarUrl ? "transparent" : "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                boxShadow: "0 2px 8px rgba(37,99,235,0.4)",
              }}
              title={userName}
              aria-label={`Conta de ${userName}`}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                : initials}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
