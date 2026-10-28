/*
 * Eventos do funil (EQZ-01), tirados das escritas que dão certo na API (lib/api.ts chama
 * eventoDaChamada depois de cada resposta ok). Assim a tela não precisa lembrar de registrar.
 * Só vai o que ajuda a entender o uso: plano, ramo, tipo, quantidade. Nunca nome, e-mail, CPF,
 * nome de produto ou texto digitado.
 *
 * Funil principal: cadastro_criado → empresa_criada → produto_cadastrado / produtos_importados
 * → movimentacao_registrada → assinou (este sai do PagamentoEmbutido).
 */

export interface Evento {
  nome:  string;
  props: Record<string, string | number | boolean | null>;
}

type Corpo = Record<string, unknown>;

const texto  = (v: unknown) => (typeof v === "string" ? v : null);
const numero = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function eventoDaChamada(metodo: string, caminho: string, corpo: unknown, resposta: unknown): Evento | null {
  if (metodo !== "POST") return null;
  const rota = caminho.split("?")[0];
  const c = (corpo && typeof corpo === "object" ? corpo : {}) as Corpo;
  const r = (resposta && typeof resposta === "object" ? resposta : {}) as Corpo;

  if (rota === "/workspaces") {
    return { nome: "empresa_criada", props: { plano: texto(c.plan), ramo: texto(c.segment), teste_gratis: r.trial === true } };
  }
  if (rota === "/products") return { nome: "produto_cadastrado", props: { origem: "manual" } };
  if (rota === "/products/import") {
    return { nome: "produtos_importados", props: { quantidade: numero(r.criados), ignorados: numero(r.ignorados) } };
  }
  if (rota === "/nfe/importar") {
    return { nome: "nota_importada", props: { tipo: texto(c.tipo), itens: Array.isArray(c.itens) ? c.itens.length : null } };
  }
  if (/^\/products\/[^/]+\/adjust$/.test(rota)) {
    const delta = numero(c.delta);
    return { nome: "movimentacao_registrada", props: { tipo: delta === null ? null : delta > 0 ? "entrada" : "saida", motivo: texto(c.motivo) } };
  }
  /* EQZ-69: vários produtos de uma vez (só o tamanho da lista, nunca os produtos) */
  if (rota === "/products/adjust-batch") {
    return { nome: "movimentacao_em_lote", props: { tipo: texto(c.tipo), motivo: texto(c.motivo), produtos: Array.isArray(c.itens) ? c.itens.length : null } };
  }
  if (/^\/products\/[^/]+\/count$/.test(rota)) return { nome: "contagem_feita", props: {} };
  if (rota === "/shopping-list")      return { nome: "item_na_lista_de_compras", props: {} };
  if (rota === "/members/invite")     return { nome: "membro_convidado", props: { papel: texto(c.role) } };
  if (rota === "/members/accept")     return { nome: "convite_aceito", props: {} };
  if (rota === "/billing/checkout")   return { nome: "pagamento_aberto", props: { plano: texto(c.plan), no_app: c.embutido === true } };
  if (rota === "/billing/cancel-feedback") {
    return { nome: "motivo_cancelamento", props: { motivo: texto(c.motivo), acao: texto(c.acao) } };
  }
  if (rota === "/billing/cancel")     return { nome: "assinatura_cancelada", props: {} };
  if (rota === "/billing/uncancel")   return { nome: "cancelamento_desfeito", props: {} };
  if (rota === "/billing/pause")      return { nome: "assinatura_pausada", props: { meses: numero(c.meses) } };
  if (rota === "/billing/resume")     return { nome: "assinatura_retomada", props: {} };
  return null;
}
