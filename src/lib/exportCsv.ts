import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { MOTIVOS, type Motivo } from "@/lib/stock";

/*
 * Exportação em CSV (SCRUM-63). Funciona também no modo somente leitura (trial expirado ou
 * assinatura cancelada), que é quando o cliente mais precisa levar os dados embora.
 * Formato do Excel em português: separador ";", vírgula decimal, UTF-8 com BOM e linhas CRLF.
 */

const PAGE = 1000; /* o PostgREST devolve no máximo 1000 linhas por requisição */

type Cell = string | number | null | undefined;

/** Texto: entre aspas quando precisa; "=", "+", "-" e "@" no início viram texto para o Excel não executar fórmula. */
function text(v: string | null | undefined): string {
  let s = (v ?? "").replace(/\r?\n/g, " ");
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[;"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Código de barras só com dígitos: sem isso o Excel mostra 7,9E+12 e tira o zero de "002". */
function code(v: string | null | undefined): string {
  return v && /^\d+$/.test(v) ? `="${v}"` : text(v);
}

function num(v: number | string | null | undefined, decimals: number, fixed = false): string {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("pt-BR", {
    useGrouping: false,
    minimumFractionDigits: fixed ? decimals : 0,
    maximumFractionDigits: decimals,
  });
}

function dateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).replace(",", "");
}

function download(filename: string, header: string[], rows: Cell[][]) {
  const lines = [header.join(";"), ...rows.map((r) => r.map((c) => (c ?? "").toString()).join(";"))];
  const blob  = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function fileName(wsName: string, what: string) {
  const slug = wsName.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "workspace";
  const today = new Date().toLocaleDateString("sv-SE"); /* AAAA-MM-DD */
  return `estoquizen-${slug}-${what}-${today}.csv`;
}

/** Busca todas as páginas de uma consulta (a consulta é recriada a cada página). */
async function fetchAll<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await query(from, from + PAGE - 1);
    if (error) throw new Error("Não foi possível ler os dados para exportar. Tente novamente.");
    all.push(...(data ?? []));
    if (!data || data.length < PAGE) return all;
  }
}

interface ProductRow {
  name: string; code: string | null; category: string | null; unit: string | null;
  qty: number | string; min_qty: number | string | null; max_qty: number | string | null;
  price: number | string | null; cost: number | string | null; location: string | null; supplier: string | null;
  nota_fiscal: string | null; created_at: string;
}

/** Baixa os produtos do workspace. Retorna quantos foram exportados. */
export async function exportProductsCsv(workspaceId: string, wsName: string): Promise<number> {
  const rows = await fetchAll<ProductRow>((from, to) =>
    supabase
      .from("products")
      .select("name, code, category, unit, qty, min_qty, max_qty, price, cost, location, supplier, nota_fiscal, created_at")
      .eq("workspace_id", workspaceId)
      .order("name")
      .range(from, to),
  );

  download(
    fileName(wsName, "produtos"),
    ["Nome", "Código", "Categoria", "Unidade", "Quantidade", "Estoque mínimo", "Estoque máximo", "Preço (R$)", "Custo (R$)", "Local", "Fornecedor", "Nota fiscal", "Cadastrado em"],
    rows.map((p) => [
      text(p.name), code(p.code), text(p.category), text(p.unit),
      num(p.qty, 3), num(p.min_qty, 3), num(p.max_qty, 3), num(p.price, 2, true), num(p.cost, 2, true),
      text(p.location), text(p.supplier), text(p.nota_fiscal), dateTime(p.created_at),
    ]),
  );
  return rows.length;
}

interface MovementRow {
  delta: number | string; reason: string | null; motivo: string | null; created_at: string; created_by: string | null;
  products: { name: string; code: string | null; unit: string | null } | { name: string; code: string | null; unit: string | null }[] | null;
}

interface MemberRow { user_id: string; profiles: { name?: string | null; email?: string | null } | null }

/** Baixa todo o histórico de movimentações do workspace, mais recentes primeiro. */
export async function exportMovementsCsv(workspaceId: string, wsName: string): Promise<number> {
  const [rows, members] = await Promise.all([
    fetchAll<MovementRow>((from, to) =>
      supabase
        .from("movements")
        .select("delta, reason, motivo, created_at, created_by, products!inner(name, code, unit, workspace_id)")
        .eq("products.workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .range(from, to),
    ),
    /* Só para mostrar o nome de quem fez; se falhar, a coluna sai vazia */
    api.get<MemberRow[]>(`/members?workspace_id=${workspaceId}`).catch(() => [] as MemberRow[]),
  ]);

  const names = new Map(members.map((m) => [m.user_id, m.profiles?.name || m.profiles?.email || ""]));

  download(
    fileName(wsName, "movimentacoes"),
    ["Data", "Produto", "Código", "Tipo", "Quantidade", "Unidade", "Motivo", "Observação", "Feito por"],
    rows.map((m) => {
      const p = Array.isArray(m.products) ? m.products[0] : m.products;
      const delta = Number(m.delta);
      return [
        dateTime(m.created_at), text(p?.name), code(p?.code), delta >= 0 ? "Entrada" : "Saída",
        num(Math.abs(delta), 3), text(p?.unit), text(m.motivo ? MOTIVOS[m.motivo as Motivo] ?? m.motivo : ""), text(m.reason),
        text(m.created_by ? names.get(m.created_by) : ""),
      ];
    }),
  );
  return rows.length;
}
