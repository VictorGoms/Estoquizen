"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRole, type WorkspaceRole } from "@/hooks/useRole";
import { useAlertCount } from "@/hooks/useAlertCount";

const NAV_ITEMS: Array<{ label: string; href: string; roles: WorkspaceRole[]; icon: (active: boolean) => React.ReactElement }> = [
  {
    label: "Home",
    href: "/dashboard",
    roles: ["owner", "admin", "member"],
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Estoque",
    href: "/estoque",
    roles: ["owner", "admin", "member"],
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: "Membros",
    href: "/membros",
    roles: ["owner", "admin", "member"],
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Métricas",
    href: "/dashboard-metricas",
    roles: ["owner", "admin"],
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: "Config",
    href: "/configuracoes",
    roles: ["owner", "admin"],
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const role = useRole() ?? "member";
  const alertCount = useAlertCount();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: "rgba(15,23,42,0.96)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="flex items-stretch max-w-lg mx-auto">
        {NAV_ITEMS.filter((item) => item.roles.includes(role)).map((item) => {
          const active = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 cursor-pointer transition-colors duration-200"
              style={{ color: active ? "#60A5FA" : "#475569" }}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <span className="relative">
                {item.icon(active)}
                {item.href === "/notificacoes" && alertCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                    style={{ background: "#EF4444" }}
                  >
                    {alertCount > 99 ? "99+" : alertCount}
                  </span>
                )}
              </span>
              <span
                className="text-[10px] font-medium leading-none"
                style={{ color: active ? "#60A5FA" : "#475569" }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
