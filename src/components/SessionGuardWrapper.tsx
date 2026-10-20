"use client";

import { usePathname } from "next/navigation";
import SessionGuard from "@/components/SessionGuard";
import WorkspaceGate from "@/components/WorkspaceGate";
import { UserProvider } from "@/lib/userContext";

const PUBLIC_PATHS = ["/", "/login", "/register", "/register-company", "/plan-selection", "/auth/callback", "/forgot-password", "/reset-password", "/convite-invalido", "/set-password", "/aceitar-convite", "/licencas"];

export default function SessionGuardWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isPublic) return <>{children}</>;
  return (
    <UserProvider>
      <SessionGuard>
        <WorkspaceGate>{children}</WorkspaceGate>
      </SessionGuard>
    </UserProvider>
  );
}
