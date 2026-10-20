"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AssinaturaBloqueada from "@/components/dashboard/AssinaturaBloqueada";
import { getWorkspace, type ActiveWorkspace } from "@/hooks/useWorkspace";
import { useSubscription, estaBloqueada } from "@/hooks/useSubscription";

/*
 * Workspace com a assinatura encerrada (trial vencido sem pagamento, cancelada ou em exclusão):
 * as páginas internas viram a tela de bloqueio. Ficam abertas só a troca de workspace, o perfil e
 * Configurações (exportar, trocar de plano, excluir o workspace). O banco e a API já recusam as
 * escritas; aqui é para a pessoa entender o estado em vez de achar que o app quebrou.
 */
const LIVRES = ["/select-workspace", "/perfil", "/configuracoes"];

export default function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const livre    = LIVRES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const [ws, setWs] = useState<ActiveWorkspace | null>(null);

  /* O workspace ativo fica no localStorage: lê depois de montar e a cada troca de página */
  useEffect(() => { setWs(getWorkspace()); }, [pathname]);

  const { sub } = useSubscription(livre ? null : ws?.id);

  if (!livre && ws && sub && estaBloqueada(sub)) return <AssinaturaBloqueada workspace={ws} sub={sub} />;
  return <>{children}</>;
}
