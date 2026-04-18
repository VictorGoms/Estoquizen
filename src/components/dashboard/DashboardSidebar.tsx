"use client";

import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { getWorkspace, type WorkspaceRole } from "@/hooks/useWorkspace";
import { useRole } from "@/hooks/useRole";
import { useUser } from "@/lib/userContext";

interface DashboardSidebarProps {
  workspaceName?: string;
  userInitials?: string;
  userName?: string;
  userEmail?: string;
}

const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [
      {
        id: "dashboard",
        href: "/dashboard",
        label: "Início",
        roles: ["owner", "admin", "member"] as WorkspaceRole[],
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
      {
        id: "estoque",
        href: "/estoque",
        label: "Estoque",
        roles: ["owner", "admin", "member"] as WorkspaceRole[],
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        ),
      },
      {
        id: "nota",
        href: "/nota",
        label: "Importar compra",
        badge: "NF-e",
        roles: ["owner", "admin"] as WorkspaceRole[],
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        id: "dashboard-metricas",
        href: "/dashboard-metricas",
        label: "Métricas",
        roles: ["owner", "admin"] as WorkspaceRole[],
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Equipe",
    items: [
      {
        id: "membros",
        href: "/membros",
        label: "Membros",
        roles: ["owner", "admin", "member"] as WorkspaceRole[],
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
      {
        id: "configuracoes",
        href: "/configuracoes",
        label: "Configurações",
        roles: ["owner", "admin"] as WorkspaceRole[],
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
    ],
  },
];

function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
}

export default function DashboardSidebar({
  workspaceName: workspaceNameProp = "",
  userInitials,
  userName: userNameProp,
  userEmail: userEmailProp,
}: DashboardSidebarProps) {
  const { userName: ctxName, userEmail: ctxEmail, avatarUrl } = useUser();
  const userName    = userNameProp  ?? ctxName;
  const userEmail   = userEmailProp ?? ctxEmail;
  const workspaceName = workspaceNameProp || getWorkspace()?.name || "";
  const initials = userInitials ?? getInitials(userName || "?");
  const router = useRouter();
  const pathname = usePathname();
  const role: WorkspaceRole = useRole() ?? "member";

  return (
    <aside
      className="hidden lg:flex flex-col fixed top-0 left-0 h-full w-60 z-50"
      style={{
        background: "rgba(13,19,35,0.98)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo + workspace */}
      <div
        className="px-4 py-4 flex flex-col gap-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        {/* Logo */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 cursor-pointer group w-fit"
          aria-label="Estoquizen"
        >
          <Logo size={26} />
          <span className="font-display font-bold text-sm text-white group-hover:text-brand-300 transition-colors duration-200">
            Estoquizen
          </span>
        </button>

        {/* Workspace switcher */}
        <button
          onClick={() => router.push("/select-workspace")}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group"
          style={{
            background: "rgba(29,78,216,0.12)",
            border: "1px solid rgba(59,130,246,0.18)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(29,78,216,0.2)";
            e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(29,78,216,0.12)";
            e.currentTarget.style.borderColor = "rgba(59,130,246,0.18)";
          }}
          aria-label="Trocar workspace"
        >
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}
          >
            {workspaceName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-semibold text-slate-300 truncate flex-1 text-left">
            {workspaceName}
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-slate-600 flex-shrink-0 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-[9px] text-slate-700 uppercase tracking-widest font-semibold px-2 mb-1.5">
              {section.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.filter((item) => item.roles.includes(role)).map((item) => {
                const active = pathname === item.href;
                return (
                  <button
                    key={item.id}
                    onClick={() => router.push(item.href)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left cursor-pointer transition-all duration-200 group"
                    style={{
                      background: active ? "rgba(37,99,235,0.18)" : "transparent",
                      color: active ? "#93C5FD" : "#64748B",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                        e.currentTarget.style.color = "#CBD5E1";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#64748B";
                      }
                    }}
                    aria-current={active ? "page" : undefined}
                  >
                    <span
                      className="flex-shrink-0 transition-colors duration-200"
                      style={{ color: active ? "#60A5FA" : "inherit" }}
                    >
                      {item.icon}
                    </span>
                    <span className="text-xs font-medium flex-1 truncate">
                      {item.label}
                    </span>
                    {"badge" in item && item.badge && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: "rgba(29,78,216,0.25)", color: "#93C5FD" }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {active && (
                      <span
                        className="w-1 h-1 rounded-full flex-shrink-0"
                        style={{ background: "#3B82F6" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: user */}
      <div
        className="px-3 py-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200"
          style={{ background: "transparent" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          aria-label="Perfil do usuário"
        >
          <div
            className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
            style={{
              background: avatarUrl ? "transparent" : "linear-gradient(135deg,#1d4ed8,#3b82f6)",
              boxShadow: "0 2px 8px rgba(37,99,235,0.35)",
            }}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-slate-300 truncate leading-none">{userName}</p>
            <p className="text-[10px] text-slate-600 truncate mt-0.5 leading-none">{userEmail}</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
