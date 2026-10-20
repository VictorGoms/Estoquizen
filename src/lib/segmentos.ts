/*
 * "Qual é o seu negócio?" (EQZ-13, aprovado pelo João em 2026-10-17). O segmento:
 * - ordena os atalhos de unidade no cadastro de produto (a lista de unidades é uma só para todos);
 * - oferece uma lista pronta de produtos do ramo (/estoque/modelo), com mínimo sugerido;
 * - muda o vocabulário dessa lista (insumo × produto) e a dica de rotina (contar × dar saída).
 * Os ids são os do CHECK de workspaces.segment. "Outro" guarda o texto em segment_other.
 * Os nomes dos itens batem com o dicionário de ícones (iconeProduto.ts), então já aparecem com ícone.
 */

/** Lista única de unidades (decisão de 2026-10-17); o cadastro mostra só estes botões, sem digitar */
export const UNIDADES = ["un", "kg", "g", "L", "ml", "cx", "pct", "peça", "par", "fardo", "saco", "garrafa", "m"];

export type Segmento = "mercearia" | "bar" | "buffet" | "roupas" | "pet" | "oficina" | "outro";

export interface ItemModelo {
  nome:    string;
  unidade: string;
  minimo:  number;
}

export interface SegmentoInfo {
  id:        Segmento;
  label:     string;
  /** Exemplo curto no cartão de escolha */
  exemplo:   string;
  /** Unidades que aparecem primeiro como atalho */
  unidades:  string[];
  /** "insumos" para quem produz (bar, buffet), "produtos" para quem revende */
  termo:     "produtos" | "insumos";
  /** Rotina sugerida para manter o estoque certo */
  dica:      string;
  modelo:    ItemModelo[];
}

export const SEGMENTOS: SegmentoInfo[] = [
  {
    id: "mercearia", label: "Mercearia ou mercado", exemplo: "Arroz, feijão, bebidas",
    unidades: ["un", "kg", "pct", "cx", "fardo", "L"], termo: "produtos",
    dica: "Dê saída pelo scanner a cada venda, ou some as vendas do dia no fim do expediente.",
    modelo: [
      { nome: "Arroz tipo 1 5 kg", unidade: "un", minimo: 5 },
      { nome: "Feijão carioca 1 kg", unidade: "un", minimo: 10 },
      { nome: "Açúcar refinado 1 kg", unidade: "un", minimo: 10 },
      { nome: "Óleo de soja 900 ml", unidade: "un", minimo: 10 },
      { nome: "Café torrado 500 g", unidade: "un", minimo: 6 },
      { nome: "Leite integral 1 L", unidade: "un", minimo: 12 },
      { nome: "Macarrão espaguete 500 g", unidade: "un", minimo: 10 },
      { nome: "Sal refinado 1 kg", unidade: "un", minimo: 5 },
      { nome: "Ovos brancos (dúzia)", unidade: "cx", minimo: 5 },
      { nome: "Molho de tomate 340 g", unidade: "un", minimo: 10 },
      { nome: "Detergente 500 ml", unidade: "un", minimo: 6 },
      { nome: "Papel higiênico 12 rolos", unidade: "pct", minimo: 4 },
      { nome: "Refrigerante 2 L", unidade: "un", minimo: 12 },
      { nome: "Cerveja lata 350 ml", unidade: "un", minimo: 24 },
      { nome: "Água mineral 500 ml", unidade: "un", minimo: 24 },
    ],
  },
  {
    id: "bar", label: "Bar ou restaurante", exemplo: "Bebidas, porções, cozinha",
    unidades: ["un", "garrafa", "L", "kg", "cx", "fardo"], termo: "insumos",
    dica: "No fim do turno, faça a contagem dos itens que mais saem: é o jeito mais rápido de achar perda.",
    modelo: [
      { nome: "Cerveja lata 350 ml", unidade: "un", minimo: 48 },
      { nome: "Cerveja long neck", unidade: "un", minimo: 24 },
      { nome: "Chopp barril 50 L", unidade: "un", minimo: 1 },
      { nome: "Refrigerante lata 350 ml", unidade: "un", minimo: 24 },
      { nome: "Água mineral 500 ml", unidade: "un", minimo: 24 },
      { nome: "Água tônica", unidade: "un", minimo: 12 },
      { nome: "Vodka 1 L", unidade: "garrafa", minimo: 2 },
      { nome: "Cachaça 1 L", unidade: "garrafa", minimo: 2 },
      { nome: "Whisky 1 L", unidade: "garrafa", minimo: 1 },
      { nome: "Gin 750 ml", unidade: "garrafa", minimo: 1 },
      { nome: "Limão taiti", unidade: "kg", minimo: 2 },
      { nome: "Gelo 5 kg", unidade: "saco", minimo: 5 },
      { nome: "Batata palito congelada", unidade: "kg", minimo: 5 },
      { nome: "Calabresa", unidade: "kg", minimo: 2 },
      { nome: "Queijo mussarela", unidade: "kg", minimo: 2 },
      { nome: "Guardanapo", unidade: "pct", minimo: 5 },
    ],
  },
  {
    id: "buffet", label: "Buffet ou eventos", exemplo: "Insumos de cozinha e festa",
    unidades: ["kg", "un", "L", "pct", "cx", "g"], termo: "insumos",
    dica: "Antes e depois de cada evento, conte os insumos principais: assim você sabe quanto cada festa consome.",
    modelo: [
      { nome: "Carne bovina (alcatra)", unidade: "kg", minimo: 10 },
      { nome: "Peito de frango", unidade: "kg", minimo: 10 },
      { nome: "Arroz tipo 1", unidade: "kg", minimo: 10 },
      { nome: "Feijão carioca", unidade: "kg", minimo: 5 },
      { nome: "Batata", unidade: "kg", minimo: 10 },
      { nome: "Cebola", unidade: "kg", minimo: 5 },
      { nome: "Tomate", unidade: "kg", minimo: 5 },
      { nome: "Alho", unidade: "kg", minimo: 1 },
      { nome: "Queijo mussarela", unidade: "kg", minimo: 3 },
      { nome: "Óleo de soja 900 ml", unidade: "un", minimo: 6 },
      { nome: "Leite condensado", unidade: "un", minimo: 12 },
      { nome: "Chocolate em pó", unidade: "kg", minimo: 1 },
      { nome: "Granulado", unidade: "kg", minimo: 1 },
      { nome: "Refrigerante 2 L", unidade: "un", minimo: 24 },
      { nome: "Suco de laranja", unidade: "L", minimo: 10 },
      { nome: "Guardanapo", unidade: "pct", minimo: 10 },
    ],
  },
  {
    id: "roupas", label: "Loja de roupas ou calçados", exemplo: "Peças por modelo, cor e tamanho",
    unidades: ["peça", "par", "un"], termo: "produtos",
    dica: "Cadastre cada combinação como um produto (Modelo · Cor · Tamanho) e use o código de barras da etiqueta.",
    modelo: [
      { nome: "Camiseta básica · Preta · M", unidade: "peça", minimo: 3 },
      { nome: "Camiseta básica · Branca · M", unidade: "peça", minimo: 3 },
      { nome: "Calça jeans · Azul · 40", unidade: "peça", minimo: 2 },
      { nome: "Bermuda · Preta · 40", unidade: "peça", minimo: 2 },
      { nome: "Blusa · Branca · M", unidade: "peça", minimo: 2 },
      { nome: "Vestido · Floral · M", unidade: "peça", minimo: 1 },
      { nome: "Moletom · Cinza · G", unidade: "peça", minimo: 1 },
      { nome: "Meia · Preta · Único", unidade: "par", minimo: 6 },
      { nome: "Tênis · Branco · 39", unidade: "par", minimo: 1 },
      { nome: "Chinelo · Preto · 39/40", unidade: "par", minimo: 3 },
      { nome: "Boné · Preto · Único", unidade: "peça", minimo: 2 },
      { nome: "Bolsa · Preta · Única", unidade: "peça", minimo: 1 },
    ],
  },
  {
    id: "pet", label: "Pet shop", exemplo: "Ração, petiscos, acessórios",
    unidades: ["un", "saco", "pct", "kg"], termo: "produtos",
    dica: "Dê saída a cada venda pelo scanner: ração e areia acabam rápido e o alerta avisa antes.",
    modelo: [
      { nome: "Ração cães adultos 15 kg", unidade: "saco", minimo: 3 },
      { nome: "Ração cães filhotes 3 kg", unidade: "pct", minimo: 3 },
      { nome: "Ração gatos adultos 10 kg", unidade: "saco", minimo: 2 },
      { nome: "Sachê para gatos 85 g", unidade: "un", minimo: 24 },
      { nome: "Areia sanitária 4 kg", unidade: "pct", minimo: 5 },
      { nome: "Petisco bifinho", unidade: "pct", minimo: 10 },
      { nome: "Osso para cães", unidade: "un", minimo: 10 },
      { nome: "Shampoo pet 500 ml", unidade: "un", minimo: 3 },
      { nome: "Coleira ajustável", unidade: "un", minimo: 3 },
      { nome: "Peitoral para cães", unidade: "un", minimo: 2 },
    ],
  },
  {
    id: "oficina", label: "Oficina ou autopeças", exemplo: "Óleo, filtros, peças",
    unidades: ["un", "peça", "par", "L", "cx", "m"], termo: "produtos",
    dica: "Dê saída das peças em cada serviço: no fim do mês você vê o que mais gira.",
    modelo: [
      { nome: "Óleo de motor 5W30 1 L", unidade: "un", minimo: 12 },
      { nome: "Óleo de motor 15W40 1 L", unidade: "un", minimo: 12 },
      { nome: "Filtro de óleo", unidade: "un", minimo: 6 },
      { nome: "Filtro de ar", unidade: "un", minimo: 4 },
      { nome: "Lâmpada farol H4", unidade: "un", minimo: 4 },
      { nome: "Lâmpada pingo", unidade: "un", minimo: 10 },
      { nome: "Pneu aro 14", unidade: "un", minimo: 2 },
      { nome: "Parafuso de roda", unidade: "un", minimo: 20 },
      { nome: "Chave de fenda", unidade: "un", minimo: 1 },
      { nome: "Lubrificante spray", unidade: "un", minimo: 3 },
    ],
  },
  {
    id: "outro", label: "Outro", exemplo: "Escreva qual é",
    unidades: ["un"], termo: "produtos",
    dica: "Comece pelos 10 itens que mais vendem ou que mais faltam: o resto entra aos poucos.",
    modelo: [],
  },
];

export const segmentoInfo = (id: string | null | undefined): SegmentoInfo | null =>
  SEGMENTOS.find((s) => s.id === id) ?? null;

/** Unidades na ordem do segmento: os atalhos dele primeiro, depois o resto da lista única. */
export function ordenarUnidades(todas: string[], segmento: string | null | undefined): string[] {
  const primeiro = segmentoInfo(segmento)?.unidades ?? [];
  return [...primeiro.filter((u) => todas.includes(u)), ...todas.filter((u) => !primeiro.includes(u))];
}
