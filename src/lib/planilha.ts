import { sanitizeText, sanitizeCode } from "@/lib/sanitize";

/*
 * Importação de planilha (EQZ-14). Lê CSV ou Excel (.xlsx) no navegador, adivinha qual coluna é
 * qual pelo cabeçalho e valida linha a linha. A API recebe os produtos já prontos
 * (POST /products/import) e grava tudo numa transação.
 */

export type Campo =
  | "name" | "code" | "qty" | "unit" | "price" | "cost"
  | "min_qty" | "max_qty" | "category" | "supplier" | "location";

type Tipo = "texto" | "codigo" | "qtd" | "preco" | "unidade";

/* A ordem importa na adivinhação: "preço de custo" é custo antes de ser preço, "estoque mínimo"
   é mínimo antes de ser quantidade, "código do produto" é código antes de ser nome. */
export const CAMPOS: { campo: Campo; label: string; tipo: Tipo; nomes: string[] }[] = [
  { campo: "cost",     label: "Custo (R$)",      tipo: "preco",   nomes: ["custo", "preco de custo", "valor de custo", "preco custo", "custo unitario", "preco de compra", "valor de compra", "preco compra", "valor compra"] },
  { campo: "min_qty",  label: "Estoque mínimo",  tipo: "qtd",     nomes: ["minimo", "estoque minimo", "est minimo", "est min", "qtd minima", "quantidade minima", "min"] },
  { campo: "max_qty",  label: "Estoque máximo",  tipo: "qtd",     nomes: ["maximo", "estoque maximo", "est maximo", "est max", "qtd maxima", "quantidade maxima", "max"] },
  { campo: "code",     label: "Código",          tipo: "codigo",  nomes: ["codigo", "cod", "codigo de barras", "cod barras", "barras", "ean", "gtin", "sku", "ref", "referencia", "codigo do produto", "cod produto"] },
  { campo: "price",    label: "Preço de venda (R$)", tipo: "preco", nomes: ["preco", "preco de venda", "preco venda", "valor", "valor de venda", "valor venda", "valor unitario", "preco unitario", "pv"] },
  { campo: "qty",      label: "Quantidade",      tipo: "qtd",     nomes: ["quantidade", "qtd", "qtde", "quant", "qt", "estoque", "estoque atual", "saldo", "saldo atual", "em estoque"] },
  { campo: "unit",     label: "Unidade",         tipo: "unidade", nomes: ["unidade", "un", "und", "unid", "unidade de medida", "medida", "um"] },
  { campo: "category", label: "Categoria",       tipo: "texto",   nomes: ["categoria", "grupo", "departamento", "secao", "familia", "tipo"] },
  { campo: "supplier", label: "Fornecedor",      tipo: "texto",   nomes: ["fornecedor", "distribuidor", "fabricante"] },
  { campo: "location", label: "Local",           tipo: "texto",   nomes: ["local", "localizacao", "prateleira", "setor", "corredor", "posicao"] },
  { campo: "name",     label: "Nome do produto", tipo: "texto",   nomes: ["nome", "produto", "descricao", "item", "nome do produto", "descricao do produto", "mercadoria", "artigo"] },
];

/* Ordem de exibição na tela de colunas */
export const CAMPOS_TELA: Campo[] = ["name", "code", "qty", "unit", "price", "cost", "min_qty", "max_qty", "category", "supplier", "location"];

export const campoInfo = (c: Campo) => CAMPOS.find((x) => x.campo === c)!;

export type Mapa = Record<Campo, number | null>;

export type Celula = string | number | boolean | Date | null;

export interface Planilha {
  cabecalho: string[];
  linhas:    Celula[][];
  /* Número da linha no arquivo (1 = primeira), para a pessoa achar a linha com erro */
  numeros:   number[];
}

export const MAX_LINHAS = 5000;

/** Minúsculas, sem acento e só letras/números separados por um espaço. */
function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const vazia = (c: Celula) => c === null || c === undefined || (typeof c === "string" && c.trim() === "");

/* ── Leitura do arquivo ─────────────────────────────────────────────────────────────────── */

/** CSV com ";" (Excel em português), "," ou tabulação; aspas e quebra de linha dentro de aspas. */
export function parseCsv(texto: string): string[][] {
  const t = texto.replace(/^﻿/, "");
  const primeira = t.slice(0, t.search(/\r?\n/) === -1 ? t.length : t.search(/\r?\n/));
  const conta = (sep: string) => primeira.split(sep).length - 1;
  const sep = [";", "\t", ","].reduce((melhor, s) => (conta(s) > conta(melhor) ? s : melhor), ";");

  const linhas: string[][] = [];
  let linha: string[] = [];
  let campo = "";
  let aspas = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (aspas) {
      if (ch === '"') {
        if (t[i + 1] === '"') { campo += '"'; i++; } else aspas = false;
      } else campo += ch;
    } else if (ch === '"' && campo === "") {
      aspas = true;
    } else if (ch === sep) {
      linha.push(campo); campo = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && t[i + 1] === "\n") i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = "";
    } else campo += ch;
  }
  if (campo !== "" || linha.length > 0) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

/** UTF-8; se não for (CSV salvo pelo Excel antigo), Windows-1252. */
function decodificar(buf: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}

export async function lerArquivo(file: File): Promise<Planilha> {
  const nome = file.name.toLowerCase();
  let bruto: Celula[][];

  if (nome.endsWith(".xls")) {
    throw new Error("Esse é o formato antigo do Excel (.xls). Abra no Excel e use \"Salvar como\" .xlsx ou CSV.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Arquivo grande demais (máximo de 10 MB).");
  }

  if (nome.endsWith(".xlsx")) {
    const { readSheet } = await import("read-excel-file/browser");
    try {
      bruto = (await readSheet(file)) as unknown as Celula[][];
    } catch {
      throw new Error("Não foi possível ler essa planilha do Excel. Confira se o arquivo abre no Excel ou salve como CSV.");
    }
  } else if (nome.endsWith(".csv") || nome.endsWith(".txt") || file.type === "text/csv") {
    bruto = parseCsv(decodificar(await file.arrayBuffer()));
  } else {
    throw new Error("Envie um arquivo .xlsx (Excel) ou .csv.");
  }

  /* Cabeçalho: a primeira linha com 2 ou mais células preenchidas (pula título em cima da tabela) */
  const inicio = bruto.findIndex((l) => l.filter((c) => !vazia(c)).length >= 2);
  if (inicio === -1) throw new Error("A planilha está vazia ou tem só uma coluna.");

  const largura = Math.max(...bruto.slice(inicio).map((l) => l.length));
  const cabecalho = Array.from({ length: largura }, (_, i) => {
    const c = bruto[inicio][i];
    return vazia(c) ? `Coluna ${i + 1}` : String(c).trim();
  });

  const linhas: Celula[][] = [];
  const numeros: number[] = [];
  for (let i = inicio + 1; i < bruto.length; i++) {
    if (bruto[i].every(vazia)) continue;
    linhas.push(bruto[i]);
    numeros.push(i + 1);
  }
  if (linhas.length === 0) throw new Error("A planilha tem o cabeçalho, mas nenhum produto embaixo.");
  if (linhas.length > MAX_LINHAS) throw new Error(`A planilha tem ${linhas.length} linhas. Importe até ${MAX_LINHAS} por vez.`);

  return { cabecalho, linhas, numeros };
}

/* ── Colunas ───────────────────────────────────────────────────────────────────────────── */

/** Qual coluna é qual, pelo nome do cabeçalho. Cada coluna vai para um campo só. */
export function adivinharColunas(cabecalho: string[]): Mapa {
  const norm = cabecalho.map(normalizar);
  const usadas = new Set<number>();
  const mapa = Object.fromEntries(CAMPOS.map((c) => [c.campo, null])) as Mapa;

  for (const { campo, nomes } of CAMPOS) {
    let melhor = -1;
    let melhorNota = 0;
    for (let i = 0; i < norm.length; i++) {
      const h = norm[i];
      if (usadas.has(i) || !h) continue;
      let nota = 0;
      if (nomes.includes(h)) nota = 3;                                          /* igual */
      else if (nomes.some((n) => h.startsWith(n + " "))) nota = 2;              /* "quantidade em estoque" */
      else if (nomes.some((n) => n.length >= 4 && ` ${h} `.includes(` ${n} `))) nota = 1; /* "nome do item" */
      if (/\btotal\b/.test(h)) nota = 0;                                        /* "valor total" não é preço */
      if (nota > melhorNota) { melhor = i; melhorNota = nota; }
    }
    if (melhor >= 0) {
      mapa[campo] = melhor;
      usadas.add(melhor);
    }
  }
  return mapa;
}

/* ── Valores ───────────────────────────────────────────────────────────────────────────── */

/** Número de célula: aceita 1.234,56 · 1234.56 · R$ 12,90 · 1.500 (milhar). null se vazia, NaN se inválida. */
export function lerNumero(c: Celula): number | null {
  if (vazia(c)) return null;
  if (typeof c === "number") return Number.isFinite(c) ? c : NaN;
  if (typeof c !== "string") return NaN;
  const s = c.replace(/R\$|\s/gi, "");
  let norm: string;
  if (s.includes(",") && s.includes(".")) {
    /* O separador que vem por último é o decimal */
    norm = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (s.includes(",")) {
    norm = s.replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    norm = s.replace(/\./g, ""); /* 1.500 = mil e quinhentos, como no Brasil */
  } else {
    norm = s;
  }
  return /^-?(\d+\.?\d*|\.\d+)$/.test(norm) ? Number(norm) : NaN;
}

function lerTexto(c: Celula, max: number): string {
  if (vazia(c)) return "";
  if (c instanceof Date) return c.toLocaleDateString("pt-BR");
  return sanitizeText(String(c), max);
}

/** Código: número do Excel vira texto sem casas; "7,89E+12" não tem conserto (o Excel já perdeu os dígitos). */
function lerCodigo(c: Celula): { code: string | null; erro?: string } {
  if (vazia(c)) return { code: null };
  if (typeof c === "number") {
    return Number.isInteger(c) ? { code: sanitizeCode(c.toFixed(0)) || null } : { code: sanitizeCode(String(c)) || null };
  }
  const s = String(c).trim();
  if (/^\d+([.,]\d+)?e\+?\d+$/i.test(s)) {
    return { code: null, erro: `código "${s}" está em notação científica: no Excel, formate a coluna como texto e salve de novo` };
  }
  return { code: sanitizeCode(s) || null };
}

const UNIDADES: Record<string, string> = {
  un: "un", und: "un", unid: "un", unidade: "un", unidades: "un", u: "un", pc: "un", pca: "un", peca: "un",
  kg: "kg", kilo: "kg", quilo: "kg", quilos: "kg",
  g: "g", gr: "g", grama: "g", gramas: "g",
  l: "L", lt: "L", litro: "L", litros: "L",
  ml: "ml",
  cx: "cx", caixa: "cx", caixas: "cx",
  pct: "pct", pacote: "pct", pacotes: "pct", fardo: "pct",
};

function lerUnidade(c: Celula): string {
  const t = lerTexto(c, 20);
  if (!t) return "un";
  return UNIDADES[normalizar(t)] ?? t.toLowerCase();
}

/* ── Validação ─────────────────────────────────────────────────────────────────────────── */

export interface ItemImport {
  name:     string;
  code:     string | null;
  qty?:     number;
  unit:     string;
  price?:   number;
  cost?:    number | null;
  min_qty?: number;
  max_qty?: number | null;
  category?: string | null;
  supplier?: string | null;
  location?: string | null;
}

export type Situacao = "ok" | "erro" | "ja_existe" | "repetido";

export interface LinhaValidada {
  numero:   number;
  situacao: Situacao;
  item:     ItemImport | null;
  /* Nome como está na planilha, para mostrar mesmo quando a linha tem erro */
  nome:     string;
  erros:    string[];
}

const MAX_NUM = 999_999_999;
const arred = (n: number, casas: number) => Math.round(n * 10 ** casas) / 10 ** casas;

/** Chave para comparar nomes de produto: "Arroz  TIPO 1" = "arroz tipo 1". */
export const chaveNome = (nome: string) => normalizar(nome);

/**
 * Valida cada linha com o mapa de colunas. Ficam de fora o que já está no estoque (pelo código ou,
 * sem código, pelo nome) e o que se repete na própria planilha: assim importar a mesma planilha
 * duas vezes não duplica nada. A API também pula código repetido; o nome só é conferido aqui.
 */
export function validar(
  p: Planilha,
  mapa: Mapa,
  existentes: { codigos: Set<string>; nomes: Set<string> },
): LinhaValidada[] {
  const vistos = new Set<string>();
  const cel = (l: Celula[], campo: Campo): Celula => (mapa[campo] === null ? null : l[mapa[campo]!] ?? null);

  return p.linhas.map((l, idx) => {
    const erros: string[] = [];
    const nome = lerTexto(cel(l, "name"), 200);
    if (nome.length === 0) erros.push("sem nome");
    else if (nome.length < 2) erros.push("nome com menos de 2 letras");

    const { code, erro: erroCodigo } = lerCodigo(cel(l, "code"));
    if (erroCodigo) erros.push(erroCodigo);

    const numero = (campo: Campo, casas: number): number | null | undefined => {
      if (mapa[campo] === null) return undefined;
      const n = lerNumero(cel(l, campo));
      if (n === null) return null;
      const label = campoInfo(campo).label.replace(/ \(R\$\)$/, "").toLowerCase();
      if (Number.isNaN(n)) { erros.push(`${label} "${String(cel(l, campo)).trim()}" não é um número`); return null; }
      if (n < 0)          { erros.push(`${label} com número negativo`); return null; }
      if (n > MAX_NUM)    { erros.push(`${label} com número grande demais`); return null; }
      return arred(n, casas);
    };

    const qty     = numero("qty", 3);
    const price   = numero("price", 2);
    const cost    = numero("cost", 2);
    const min_qty = numero("min_qty", 3);
    const max_qty = numero("max_qty", 3);

    const item: ItemImport = {
      name: nome,
      code,
      unit: lerUnidade(cel(l, "unit")),
      ...(qty     != null && { qty }),
      ...(price   != null && { price }),
      ...(cost    != null && { cost }),
      ...(min_qty != null && { min_qty }),
      ...(max_qty != null && { max_qty }),
      ...(mapa.category !== null && { category: lerTexto(cel(l, "category"), 60) || null }),
      ...(mapa.supplier !== null && { supplier: lerTexto(cel(l, "supplier"), 200) || null }),
      ...(mapa.location !== null && { location: lerTexto(cel(l, "location"), 200) || null }),
    };

    let situacao: Situacao = erros.length > 0 ? "erro" : "ok";
    if (situacao === "ok") {
      const chave = code ? `c:${code}` : `n:${chaveNome(nome)}`;
      if (code ? existentes.codigos.has(code) : existentes.nomes.has(chaveNome(nome))) situacao = "ja_existe";
      else if (vistos.has(chave)) situacao = "repetido";
      vistos.add(chave);
    }

    return { numero: p.numeros[idx], situacao, item: situacao === "erro" ? null : item, nome, erros };
  });
}

/* ── Modelo ────────────────────────────────────────────────────────────────────────────── */

/** Baixa um CSV de exemplo no formato do Excel em português (";", vírgula decimal, BOM). */
export function baixarModelo() {
  const linhas = [
    "Nome;Código;Quantidade;Unidade;Preço de venda;Custo;Estoque mínimo;Categoria;Fornecedor",
    "Arroz Tipo 1 5kg;=\"7891234567895\";12;un;27,90;21,50;5;Mercearia;Distribuidora Exemplo",
    "Feijão Carioca 1kg;;30;un;8,49;6,20;10;Mercearia;",
    "Queijo Mussarela;;2,5;kg;49,90;38,00;1;Frios;",
  ];
  const blob = new Blob(["﻿" + linhas.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = "modelo-importacao-estoquizen.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
