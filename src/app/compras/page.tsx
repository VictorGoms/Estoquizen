"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import ProductAvatar from "@/components/estoque/ProductAvatar";
import StatusChip from "@/components/estoque/StatusChip";
import { supabase } from "@/lib/supabase";
import { getWorkspace } from "@/hooks/useWorkspace";
import { useProducts, type Product } from "@/hooks/useProducts";
import { useForecast } from "@/hooks/useForecast";
import { deriveStatus, formatQty, parseQtyInput, previsaoDias, consumoDiario, formatPrevisao, type StockStatus } from "@/lib/stock";
import { CartIcon, CheckIcon } from "@/components/ui/icons";

/*
 * Lista de compras (EQZ-15). O app monta a lista com o que está no mínimo ou acaba nesta semana,
 * sugere a quantidade e a pessoa compartilha o texto pelo WhatsApp dela (sem API, sem custo).
 */

interface Item {
  p:        Product;
  status:   StockStatus;
  previsao: number | null;
  sugerida: number;
}

/* Unidades que aceitam fração (as outras sobem para o inteiro) */
const FRACIONAVEIS = new Set(["kg", "g", "l", "ml", "m"]);

function arredondaParaCima(qtd: number, unit: string): number {
  if (qtd <= 0) return 0;
  return FRACIONAVEIS.has(unit.toLowerCase()) ? Math.ceil(qtd * 10) / 10 : Math.ceil(qtd);
}

/**
 * Quanto comprar: até o máximo, se a pessoa definiu um. Sem máximo, o maior entre o dobro do
 * mínimo e ~30 dias de consumo (quando há histórico de saídas). Nunca menos de 1.
 */
function quantidadeSugerida(p: Product, porDia: number | null): number {
  const alvo = p.max_qty && p.max_qty > p.qty
    ? p.max_qty
    : Math.max(p.min_qty * 2, porDia ? porDia * 30 : 0);
  return arredondaParaCima(Math.max(alvo - p.qty, 0), p.unit) || arredondaParaCima(1, p.unit);
}

type Escolhas = Record<string, { on: boolean; qtd: number }>;
const chaveLocal = (wsId: string) => `estoquizen_compras_${wsId}`;

export default function ComprasPage() {
  const router = useRouter();
  const [wsId, setWsId]         = useState<string | undefined>(undefined);
  const [wsName, setWsName]     = useState("");
  const [userName, setUserName] = useState("");
  const [now, setNow]           = useState(0);
  const [escolhas, setEscolhas] = useState<Escolhas>({});
  const [drafts, setDrafts]     = useState<Record<string, string>>({});
  const [rodape, setRodape]     = useState(true);
  const [podeShare, setPodeShare] = useState(false);
  const [aviso, setAviso]       = useState("");

  const { products, loading } = useProducts(wsId);
  const forecast = useForecast(wsId);

  useEffect(() => {
    async function load() {
      const ws = getWorkspace();
      if (!ws) { router.push("/select-workspace"); return; }
      setWsId(ws.id);
      setWsName(ws.name);
      setNow(Date.now());
      setPodeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
      /* Escolhas da última vez (só neste navegador) */
      try {
        const salvo = localStorage.getItem(chaveLocal(ws.id));
        if (salvo) setEscolhas(JSON.parse(salvo));
      } catch { /* sem localStorage */ }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
        setUserName(profile?.name ?? user.email?.split("@")[0] ?? "");
      }
    }
    load();
  }, [router]);

  function salvar(next: Escolhas) {
    setEscolhas(next);
    if (!wsId) return;
    try { localStorage.setItem(chaveLocal(wsId), JSON.stringify(next)); } catch { /* sem localStorage */ }
  }

  /* No mínimo/zerado, ou acabando em até 7 dias pela média de saídas */
  const itens = useMemo<Item[]>(() => products
    .map((p) => {
      const status   = deriveStatus(p.qty, p.min_qty ?? 0);
      const previsao = previsaoDias(p.qty, p.created_at, forecast.get(p.id), now);
      const porDia   = consumoDiario(p.created_at, forecast.get(p.id), now);
      return { p, status, previsao, sugerida: quantidadeSugerida(p, porDia) };
    })
    .filter((i) => i.status !== "normal" || (i.previsao !== null && i.previsao <= 7))
    .sort((a, b) => a.p.name.localeCompare(b.p.name, "pt-BR")), [products, forecast, now]);

  const grupos = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const i of itens) {
      const f = i.p.supplier?.trim() || "Sem fornecedor";
      m.set(f, [...(m.get(f) ?? []), i]);
    }
    /* Fornecedores em ordem alfabética, "Sem fornecedor" por último */
    return [...m.entries()].sort(([a], [b]) =>
      a === "Sem fornecedor" ? 1 : b === "Sem fornecedor" ? -1 : a.localeCompare(b, "pt-BR"));
  }, [itens]);

  const incluido = (i: Item) => escolhas[i.p.id]?.on ?? true;
  const qtdDe    = (i: Item) => escolhas[i.p.id]?.qtd ?? i.sugerida;
  const marcados = itens.filter(incluido);

  function texto(): string {
    const data = new Date(now).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const linhas = [`*Lista de compras — ${wsName}* (${data})`];
    for (const [fornecedor, lista] of grupos) {
      const doGrupo = lista.filter(incluido);
      if (doGrupo.length === 0) continue;
      linhas.push("", `*${fornecedor}*`);
      for (const i of doGrupo) linhas.push(`• ${i.p.name} — ${formatQty(qtdDe(i))} ${i.p.unit}`);
    }
    if (rodape) linhas.push("", "Feito com Estoquizen · estoquizen.com.br");
    return linhas.join("\n");
  }

  async function compartilhar() {
    try { await navigator.share({ text: texto() }); } catch { /* a pessoa fechou a folha */ }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto());
      setAviso("Lista copiada. É só colar na conversa.");
    } catch {
      setAviso("Não foi possível copiar. Use o botão do WhatsApp.");
    }
    setTimeout(() => setAviso(""), 3000);
  }

  return (
    <div className="min-h-screen bg-ink">
      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      <main className="lg:pl-64 pt-14 pb-28 lg:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-6">

          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight leading-tight">Lista de compras</h1>
            <p className="text-sm lg:text-[15px] font-bold text-fg-muted">
              O que está no mínimo ou acaba nesta semana, com a quantidade sugerida. Ajuste e mande pelo WhatsApp.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2.5">
              {[0, 1, 2].map((i) => <div key={i} className="h-[76px] rounded-[22px] bg-surface animate-pulse" />)}
            </div>
          ) : itens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center bg-surface rounded-5xl px-6">
              <span className="w-16 h-16 rounded-full bg-ok/15 text-ok flex items-center justify-center">
                <CheckIcon className="w-8 h-8" strokeWidth={2.6} />
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-lg font-black">Nada para comprar agora</p>
                <p className="text-sm font-bold text-fg-muted">Nenhum produto está no mínimo ou acaba nesta semana.</p>
              </div>
              <Link href="/estoque" className="min-h-[44px] flex items-center px-5 rounded-full bg-surface-2 text-sm font-extrabold hover:bg-white/10 transition-colors">
                Ver estoque
              </Link>
            </div>
          ) : (
            <>
              {grupos.map(([fornecedor, lista]) => (
                <section key={fornecedor} aria-label={fornecedor} className="flex flex-col gap-2.5">
                  <h2 className="text-sm font-extrabold text-fg-muted px-1">{fornecedor}</h2>
                  <ul className="flex flex-col gap-2.5">
                    {lista.map((i) => {
                      const on = incluido(i);
                      return (
                        <li key={i.p.id} className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 pr-3.5 rounded-[22px] bg-surface transition-opacity ${on ? "" : "opacity-55"}`}>
                          <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={(e) => salvar({ ...escolhas, [i.p.id]: { on: e.target.checked, qtd: qtdDe(i) } })}
                              className="w-5 h-5 accent-[#60a5fa] shrink-0 cursor-pointer"
                              aria-label={`Incluir ${i.p.name} na lista`}
                            />
                            {/* No celular a foto sai para o nome caber */}
                            <span className="hidden sm:block shrink-0">
                              <ProductAvatar name={i.p.name} imageUrl={i.p.image_url} />
                            </span>
                            <span className="flex-1 min-w-0 flex flex-col gap-1">
                              <span className="text-[15px] font-extrabold leading-tight line-clamp-2">{i.p.name}</span>
                              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-bold text-fg-muted">
                                {i.status !== "normal" && <StatusChip status={i.status} size="sm" />}
                                <span>Tem {formatQty(i.p.qty)} {i.p.unit} · mínimo {formatQty(i.p.min_qty ?? 0)}</span>
                                {i.previsao !== null && <span>· {formatPrevisao(i.previsao)}</span>}
                              </span>
                            </span>
                          </label>
                          <span className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                            <span className="sm:hidden text-[13px] font-bold text-fg-muted">Comprar</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              aria-label={`Quantidade a comprar de ${i.p.name} (${i.p.unit})`}
                              value={drafts[i.p.id] ?? String(qtdDe(i)).replace(".", ",")}
                              onChange={(e) => setDrafts({ ...drafts, [i.p.id]: e.target.value })}
                              onBlur={() => {
                                const n = parseQtyInput(drafts[i.p.id] ?? "");
                                if (n > 0) salvar({ ...escolhas, [i.p.id]: { on: true, qtd: n } });
                                const { [i.p.id]: _, ...resto } = drafts;
                                setDrafts(resto);
                              }}
                              className="w-16 h-11 rounded-full bg-ink text-center text-[15px] font-black tabular-nums outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                            />
                            <span className="text-[13px] font-bold text-fg-muted w-7">{i.p.unit}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}

              <section aria-label="Compartilhar a lista" className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-4">
                <p className="text-sm font-bold text-fg-muted">
                  {marcados.length} {marcados.length === 1 ? "item marcado" : "itens marcados"}. Mande para você, para o fornecedor ou para quem vai comprar.
                </p>
                <label className="flex items-center gap-3 text-sm font-bold text-fg-soft cursor-pointer">
                  <input type="checkbox" checked={rodape} onChange={(e) => setRodape(e.target.checked)} className="w-5 h-5 accent-[#60a5fa] cursor-pointer" />
                  Assinar com &quot;Feito com Estoquizen&quot;
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(texto())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={marcados.length === 0}
                    className={`flex-1 min-h-[52px] flex items-center justify-center gap-2 rounded-full bg-accent text-ink text-[15px] font-black hover:brightness-110 transition-[filter] ${marcados.length === 0 ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <CartIcon className="w-5 h-5" strokeWidth={2.2} /> Mandar pelo WhatsApp
                  </a>
                  {podeShare && (
                    <button
                      type="button"
                      onClick={compartilhar}
                      disabled={marcados.length === 0}
                      className="min-h-[52px] px-6 rounded-full bg-surface-2 text-[15px] font-extrabold cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      Compartilhar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={copiar}
                    disabled={marcados.length === 0}
                    className="min-h-[52px] px-6 rounded-full bg-surface-2 text-[15px] font-extrabold cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    Copiar texto
                  </button>
                </div>
                {aviso && <p role="status" className="text-sm font-bold text-ok">{aviso}</p>}
              </section>
            </>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
