/*
 * Quais telas pedem login (EQZ-47). Toda pasta de src/app precisa estar numa das listas: o teste
 * rotas.test.ts falha se alguém criar uma tela sem dizer se é pública ou interna.
 * Endereço que não é de nenhuma tela (link quebrado) é tratado como público, para a página 404
 * aparecer em vez de mandar para o login.
 */

/** Abertas para quem não entrou */
export const ROTAS_PUBLICAS = [
  "/", "/login", "/register", "/register-company", "/plan-selection", "/auth", "/forgot-password",
  "/reset-password", "/convite-invalido", "/set-password", "/aceitar-convite", "/licencas", "/termos", "/privacidade",
];

/** Pedem sessão (SessionGuard) e workspace (WorkspaceGate) */
export const ROTAS_INTERNAS = [
  "/dashboard", "/dashboard-metricas", "/estoque", "/compras", "/contagem", "/configuracoes", "/historico",
  "/membros", "/nota", "/notificacoes", "/perfil", "/scanner", "/select-workspace",
];

/** Arquivos gerados (sem tela), fora do layout */
export const ROTAS_SEM_TELA = ["/llms.txt"];

const casa = (pathname: string, rota: string) =>
  rota === "/" ? pathname === "/" : pathname === rota || pathname.startsWith(rota + "/");

/** true = mostra a página sem SessionGuard/WorkspaceGate */
export function rotaAberta(pathname: string): boolean {
  if (ROTAS_PUBLICAS.some((r) => casa(pathname, r))) return true;
  return !ROTAS_INTERNAS.some((r) => casa(pathname, r));
}
