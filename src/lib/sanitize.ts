/**
 * Sanitiza strings vindas de campos de formulário antes de enviar para a API/banco.
 * React já escapa HTML no render, mas este utilitário adiciona proteção
 * contra dados maliciosos que possam ser armazenados e exibidos fora do React.
 */

/** Remove tags HTML, null bytes e caracteres de controle. Aplica trim e limita tamanho. */
export function sanitizeText(value: string, maxLength = 500): string {
  return value
    .replace(/\0/g, "")            // null bytes — podem quebrar queries
    .replace(/<[^>]*>/g, "")       // tags HTML — prevenção de stored XSS
    .replace(/[^\S\r\n]+/g, " ")   // múltiplos espaços → um só espaço
    .trim()
    .slice(0, maxLength);
}

/** Sanitiza email: lowercase, trim, sem HTML. */
export function sanitizeEmail(value: string): string {
  return sanitizeText(value, 254).toLowerCase();
}

/** Sanitiza campo numérico: remove tudo que não seja dígito, ponto ou vírgula. */
export function sanitizeNumber(value: string): string {
  return value.replace(/[^0-9.,]/g, "").slice(0, 20);
}

/** Sanitiza código de barras/SKU: apenas alfanumérico, hífen, ponto e underscore. */
export function sanitizeCode(value: string): string {
  return value
    .replace(/\0/g, "")
    .replace(/[^a-zA-Z0-9\-_.]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, 100);
}
