/*
 * Teste grátis. Lançamento (decisão do João em 2026-10-28; substitui os 30 dias de 2026-10-21): todos os planos
 * de graça até 05/01/2027, inclusive, sem cartão, para vender sem CNPJ; a cobrança começa em 06/01. Quem começar
 * a partir de 23/12 ganha pelo menos DIAS_MINIMOS. A regra vale na API (`src/lib/trial.ts`); aqui ficam os textos.
 * **Depois de 05/01:** voltar os textos para "14 dias grátis" e tirar o preço riscado (`components/PrecoPlano.tsx`).
 */
export const GRATIS_ATE      = "05/01";
export const GRATIS_ATE_ANO  = "05/01/2027";
export const COBRA_DESDE_ANO = "06/01/2027";
export const MINIMO_DESDE    = "23/12/2026";
export const DIAS_MINIMOS    = 14;

/** "Grátis até 05/01" */
export const TESTE_GRATIS = `Grátis até ${GRATIS_ATE}`;
