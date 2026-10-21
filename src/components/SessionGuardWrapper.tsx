"use client";

import { usePathname } from "next/navigation";
import SessionGuard from "@/components/SessionGuard";
import WorkspaceGate from "@/components/WorkspaceGate";
import { UserProvider } from "@/lib/userContext";
import { rotaAberta } from "@/lib/rotas";

/* Telas públicas e links quebrados (página 404) passam direto; a lista fica em lib/rotas.ts */
export default function SessionGuardWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (rotaAberta(pathname)) return <>{children}</>;
  return (
    <UserProvider>
      <SessionGuard>
        <WorkspaceGate>{children}</WorkspaceGate>
      </SessionGuard>
    </UserProvider>
  );
}
