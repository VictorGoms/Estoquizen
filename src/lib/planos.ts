/*
 * Planos à venda: o que aparece na escolha de plano (/plan-selection) e nos preços da landing.
 * Os limites seguem o PLAN_INFO (usePlan.ts) e a tabela fechada pelo João em 2026-10-17 (EQZ-27).
 * Os preços são os que o Stripe cobra hoje: os novos (Basic R$ 24,90, Growth R$ 39,90) entram com
 * a EQZ-11, junto com os preços novos no Stripe. Mudou aqui? Mude no Stripe também.
 */

export type PlanoId = "basic" | "growth" | "pro";

export interface PlanoVenda {
  id:          PlanoId;
  name:        string;
  price:       string;
  priceNote:   string;
  description: string;
  highlighted: boolean;
  badge?:      string;
  trialNote?:  string;
  features:    { text: string; included: boolean }[];
}

/* Recursos de todos os planos */
const TODOS = [
  "Scanner de código de barras",
  "Alerta de estoque baixo e previsão de quando acaba",
  "Lista de compras para mandar no WhatsApp",
  "Importar e exportar planilha",
];

const linhas = (itens: string[]) => itens.map((text) => ({ text, included: true }));

export const PLANOS: PlanoVenda[] = [
  {
    id: "basic",
    name: "Basic",
    price: "R$ 19,90",
    priceNote: "/mês",
    description: "Para começar sem complicação",
    highlighted: false,
    features: [
      ...linhas(["Até 50 produtos", "Até 3 pessoas na equipe", ...TODOS, "Ler nota de compra: 2 por mês", "Métricas dos últimos 30 dias"]),
      { text: "Contagem do dia e dinheiro parado", included: false },
      { text: "Histórico por funcionário", included: false },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "R$ 29,90",
    priceNote: "/mês",
    description: "Para negócios em crescimento",
    highlighted: true,
    badge: "Mais popular",
    trialNote: "14 dias grátis",
    features: [
      ...linhas([
        "Até 300 produtos", "Até 10 pessoas na equipe", ...TODOS,
        "Ler nota de compra sem limite (XML e NFC-e de SP)", "Métricas de até 3 meses", "Contagem do dia e dinheiro parado",
      ]),
      { text: "Histórico por funcionário", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 59,90",
    priceNote: "/mês",
    description: "Para operações completas",
    highlighted: false,
    features: linhas([
      "Até 2.000 produtos", "Equipe sem limite", ...TODOS,
      "Ler nota de compra sem limite (XML e NFC-e de SP)", "Métricas de até 12 meses", "Contagem do dia e dinheiro parado",
      "Histórico por funcionário", "Suporte prioritário",
    ]),
  },
];
