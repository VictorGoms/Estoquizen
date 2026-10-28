/*
 * Modo "Vários" do Escanear (EQZ-69, 2026-10-28): entrada ou saída de vários produtos de uma vez. Os
 * produtos entram na lista pela câmera (leitura contínua), pelo leitor de mão (digita o código e dá
 * Enter) ou pela busca pelo nome, para quem não tem código de barras. Tudo é gravado de uma vez em
 * POST /products/adjust-batch. Aqui ficam as regras; a tela é components/estoque/MovimentarVarios.tsx.
 */

export interface LinhaLote {
  id:  string;
  qtd: number;
}

export interface ProdutoLote {
  id:    string;
  name:  string;
  code:  string | null;
  qty:   number;
  unit:  string;
  price: number;
}

const arredondar = (n: number) => Math.round(n * 1000) / 1000;

/** Põe o produto no topo da lista ou soma na linha que ele já tem (ler duas vezes = 2). */
export function somarNaLista(linhas: LinhaLote[], id: string, qtd = 1): LinhaLote[] {
  const atual = linhas.find((l) => l.id === id);
  if (!atual) return [{ id, qtd: arredondar(qtd) }, ...linhas];
  return linhas.map((l) => (l.id === id ? { ...l, qtd: arredondar(l.qtd + qtd) } : l));
}

/** Troca a quantidade de uma linha; zero ou menos tira o produto da lista. */
export function mudarQuantidade(linhas: LinhaLote[], id: string, qtd: number): LinhaLote[] {
  if (!(qtd > 0)) return linhas.filter((l) => l.id !== id);
  return linhas.map((l) => (l.id === id ? { ...l, qtd: arredondar(qtd) } : l));
}

/** Na saída, os produtos da lista que não têm o bastante (decisão do João: bloquear com aviso). */
export function faltandoNaSaida(linhas: LinhaLote[], produtos: Map<string, ProdutoLote>): Set<string> {
  return new Set(linhas.filter((l) => {
    const p = produtos.get(l.id);
    return !p || l.qtd > Number(p.qty);
  }).map((l) => l.id));
}

/** Total da lista pelo preço de venda de cada produto. */
export function valorDaLista(linhas: LinhaLote[], produtos: Map<string, ProdutoLote>): number {
  return Math.round(linhas.reduce((soma, l) => soma + l.qtd * Number(produtos.get(l.id)?.price ?? 0), 0) * 100) / 100;
}

/** Sem acento, sem maiúscula e sem espaço sobrando, para a busca. */
export const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Código lido (câmera ou leitor de mão) → produto, sem diferença de maiúscula. */
export function mapaDeCodigos(produtos: ProdutoLote[]): Map<string, ProdutoLote> {
  const mapa = new Map<string, ProdutoLote>();
  for (const p of produtos) if (p.code) mapa.set(p.code.trim().toUpperCase(), p);
  return mapa;
}

/**
 * Busca pelo nome (todas as palavras, em qualquer ordem) ou pelo começo do código. Quem começa com o
 * termo vem primeiro. Até `limite` resultados.
 */
export function buscarNoEstoque(produtos: ProdutoLote[], termo: string, limite = 8): ProdutoLote[] {
  const t = normalizar(termo);
  if (!t) return [];
  const palavras = t.split(" ");
  const codigo   = termo.trim().toUpperCase();
  const achados  = produtos.filter((p) => {
    const nome = normalizar(p.name);
    return palavras.every((w) => nome.includes(w)) || (!!p.code && p.code.toUpperCase().startsWith(codigo));
  });
  achados.sort((a, b) => Number(normalizar(b.name).startsWith(t)) - Number(normalizar(a.name).startsWith(t)));
  return achados.slice(0, limite);
}
