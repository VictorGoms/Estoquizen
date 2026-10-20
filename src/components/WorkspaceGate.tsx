"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AssinaturaBloqueada from "@/components/dashboard/AssinaturaBloqueada";
import PageLoader from "@/components/ui/PageLoader";
import { getWorkspace, type ActiveWorkspace } from "@/hooks/useWorkspace";
import { useSubscription, estaBloqueada, lembrarBloqueio, bloqueioLembrado } from "@/hooks/useSubscription";

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
  const [lembrada, setLembrada] = useState(false);

  /* O workspace ativo fica no localStorage: lê depois de montar e a cada troca de página. É layout
     effect para valer antes da primeira pintura: assim a página com dados não aparece por um
     instante antes da tela de bloqueio (o HTML do servidor só tem o esqueleto, sem dados) */
  useLayoutEffect(() => {
    const w = getWorkspace();
    setWs(w);
    setLembrada(!!w && bloqueioLembrado(w.id));
  }, [pathname]);

  const { sub, loading } = useSubscription(livre ? null : ws?.id);
  useEffect(() => { if (ws && sub) lembrarBloqueio(ws.id, estaBloqueada(sub)); }, [ws, sub]);

  if (!livre && ws && sub && estaBloqueada(sub)) return <AssinaturaBloqueada workspace={ws} sub={sub} />;
  /* Estava bloqueado da última vez: espera a resposta em vez de mostrar a página por um instante */
  if (!livre && ws && !sub && loading && lembrada) return <PageLoader />;
  return <>{children}</>;
}
