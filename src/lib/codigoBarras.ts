import { api } from "@/lib/api";

/*
 * Nome e foto do produto pelo código de barras, no cadastro (EQZ-53, 2026-10-23):
 * 1. bases abertas da família Open Food Facts (comida, produtos em geral, beleza e pet; dados ODbL,
 *    fotos CC BY-SA, crédito em /licencas). Mesmo formato de resposta, consultadas juntas;
 * 2. se nenhuma tiver o nome, o catálogo próprio do Estoquizen (GET /catalogo/:codigo na API), com o
 *    nome que outros clientes já cadastraram, só quando confiável (regra em src/lib/catalogo.ts da API).
 * Sempre uma sugestão: a pessoa confere antes de salvar.
 */

export const BASES_ABERTAS = [
  { nome: "Open Food Facts",     url: "https://world.openfoodfacts.org" },
  { nome: "Open Products Facts", url: "https://world.openproductsfacts.org" },
  { nome: "Open Beauty Facts",   url: "https://world.openbeautyfacts.org" },
  { nome: "Open Pet Food Facts", url: "https://world.openpetfoodfacts.org" },
] as const;

/** Foto vinda de uma das bases abertas (a única foto de fora que o cadastro aceita sem upload). */
export const ehFotoDeBaseAberta = (url: string | null | undefined): url is string =>
  !!url && /^https:\/\/images\.open(food|products|beauty|petfood)facts\.(org|net)\//.test(url);

const CAMPOS = "product_name,product_name_pt_BR,product_name_pt,product_name_en,image_front_url,image_url,image_front_small_url";

/** Lê nome e foto da resposta de uma base aberta; null se ela não conhece o código. */
export function lerProdutoAberto(json: unknown): { nome: string | null; foto: string | null } | null {
  const r = json as { status?: number; product?: Record<string, unknown> } | null;
  if (r?.status !== 1 || !r.product) return null;
  const p = r.product;
  /* product_name é o campo exibido no site da base: tem prioridade */
  const nome = [p.product_name, p.product_name_pt_BR, p.product_name_pt, p.product_name_en]
    .find((n): n is string => typeof n === "string" && n.trim() !== "")?.trim() ?? null;
  const foto = [p.image_front_url, p.image_url, p.image_front_small_url]
    .find((u): u is string => typeof u === "string" && ehFotoDeBaseAberta(u)) ?? null;
  return nome || foto ? { nome, foto } : null;
}

export interface ProdutoDoCodigo {
  nome:  string | null;
  foto:  string | null;
  /** De onde veio o nome, para o aviso embaixo do campo ("pelo Open Food Facts") */
  fonte: string | null;
}

async function buscarNaBase(base: (typeof BASES_ABERTAS)[number], ean: string) {
  try {
    const res = await fetch(`${base.url}/api/v2/product/${ean}.json?fields=${CAMPOS}`);
    return { base, achado: lerProdutoAberto(await res.json()) };
  } catch {
    return { base, achado: null };
  }
}

async function buscarNoCatalogo(ean: string): Promise<{ nome: string; fonte: "nota" | "empresas" } | null> {
  try {
    return await api.get<{ nome: string; fonte: "nota" | "empresas" } | null>(`/catalogo/${encodeURIComponent(ean)}`);
  } catch {
    return null;
  }
}

export async function buscarPorCodigo(ean: string): Promise<ProdutoDoCodigo | null> {
  if (ean.length < 8) return null;
  const [abertas, catalogo] = await Promise.all([
    Promise.all(BASES_ABERTAS.map((b) => buscarNaBase(b, ean))),
    buscarNoCatalogo(ean),
  ]);
  /* A ordem da lista decide quando mais de uma base conhece o código */
  const comNome = abertas.find((a) => a.achado?.nome);
  const foto    = abertas.find((a) => a.achado?.foto)?.achado?.foto ?? null;

  if (comNome) return { nome: comNome.achado!.nome, foto, fonte: `pelo ${comNome.base.nome}` };
  if (catalogo) {
    return { nome: catalogo.nome, foto, fonte: catalogo.fonte === "nota" ? "pela nota fiscal de um fornecedor" : "por outros negócios do Estoquizen" };
  }
  return foto ? { nome: null, foto, fonte: null } : null;
}
