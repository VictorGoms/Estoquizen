/*
 * Contagem do dia (EQZ-17): "Hoje: confira 5 produtos". Os itens que mais giram (curva ABC pelo
 * valor que sai) voltam com mais frequência. A lista é a mesma o dia todo: só conta o que já tinha
 * sido contado antes de hoje.
 */

export type Classe = "A" | "B" | "C";

/** De quantos em quantos dias cada classe volta para a contagem */
export const INTERVALO: Record<Classe, number> = { A: 7, B: 14, C: 30 };
export const ITENS_POR_DIA = 5;
export const META_CONFIABILIDADE = 95;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ContagemRow {
  product_id:   string;
  created_at:   string;
  expected_qty: number;
  counted_qty:  number;
}

interface ProdutoBase { id: string; price: number }

/** Dia no horário de Brasília (UTC-3), "AAAA-MM-DD" */
export function diaBrasil(ms: number): string {
  return new Date(ms - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** A: até 80% do valor que sai em 30 dias; B: até 95%; C: o resto (inclusive sem saída). */
export function classesABC<P extends ProdutoBase>(produtos: P[], saidas30d: Map<string, number>): Map<string, Classe> {
  const valor = produtos.map((p) => ({ id: p.id, v: (saidas30d.get(p.id) ?? 0) * p.price }));
  const total = valor.reduce((s, x) => s + x.v, 0);
  const out = new Map<string, Classe>();
  let acumulado = 0;
  for (const x of valor.sort((a, b) => b.v - a.v)) {
    if (x.v <= 0 || total <= 0) { out.set(x.id, "C"); continue; }
    acumulado += x.v;
    out.set(x.id, acumulado / total <= 0.8 || acumulado === x.v ? "A" : acumulado / total <= 0.95 ? "B" : "C");
  }
  return out;
}

/* Desempate estável no mesmo dia, diferente a cada dia */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Os itens do dia: só os que já passaram do intervalo da sua classe desde a última contagem
 * (antes de hoje). Prioridade: classe A, depois B e C; dentro da classe, quem nunca foi contado e
 * depois quem está há mais tempo sem contar.
 */
export function itensDoDia<P extends ProdutoBase>(
  produtos: P[],
  classes: Map<string, Classe>,
  contagens: ContagemRow[],
  now: number,
  n = ITENS_POR_DIA,
): P[] {
  const hoje = diaBrasil(now);
  const ultima = new Map<string, number>();
  for (const c of contagens) {
    if (diaBrasil(new Date(c.created_at).getTime()) === hoje) continue;
    const t = new Date(c.created_at).getTime();
    if (t > (ultima.get(c.product_id) ?? 0)) ultima.set(c.product_id, t);
  }
  const ordemClasse: Record<Classe, number> = { A: 0, B: 1, C: 2 };
  return produtos
    .filter((p) => {
      const u = ultima.get(p.id);
      return u === undefined || now - u >= INTERVALO[classes.get(p.id) ?? "C"] * DAY_MS;
    })
    .sort((a, b) => {
      const ca = ordemClasse[classes.get(a.id) ?? "C"], cb = ordemClasse[classes.get(b.id) ?? "C"];
      if (ca !== cb) return ca - cb;
      const ua = ultima.get(a.id) ?? 0, ub = ultima.get(b.id) ?? 0;
      if (ua !== ub) return ua - ub;
      return hash(hoje + a.id) - hash(hoje + b.id);
    })
    .slice(0, n);
}

/** Contagem que bateu: diferença menor que a casa decimal que o banco guarda */
export const bateu = (c: ContagemRow) => Math.abs(Number(c.counted_qty) - Number(c.expected_qty)) < 0.0005;

/** "Confiabilidade do estoque": % das contagens dos últimos 30 dias que bateram (null sem contagens) */
export function confiabilidade(contagens: ContagemRow[], now: number): number | null {
  const recentes = contagens.filter((c) => now - new Date(c.created_at).getTime() <= 30 * DAY_MS);
  if (recentes.length === 0) return null;
  return Math.round((recentes.filter(bateu).length / recentes.length) * 100);
}

/** Dias seguidos com contagem, terminando hoje (ou ontem, se hoje ainda não contou) */
export function sequencia(contagens: ContagemRow[], now: number): number {
  const dias = new Set(contagens.map((c) => diaBrasil(new Date(c.created_at).getTime())));
  let t = dias.has(diaBrasil(now)) ? now : now - DAY_MS;
  let n = 0;
  while (dias.has(diaBrasil(t))) { n++; t -= DAY_MS; }
  return n;
}
