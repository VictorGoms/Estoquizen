/*
 * Convite (EQZ-56, auditoria de 2026-10-23): o link do e-mail diz qual workspace aceitar
 * (`?workspace_id=`). O user_metadata não serve para isso: o convite de outra empresa para a mesma
 * conta reescreve o workspace_id dele.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** workspace_id do endereço (`?workspace_id=`), ou null se não houver ou não for um id válido */
export function workspaceDoLink(search: string): string | null {
  const ws = new URLSearchParams(search).get("workspace_id");
  return ws && UUID.test(ws) ? ws.toLowerCase() : null;
}
