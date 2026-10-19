"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import AccessDenied from "@/components/ui/AccessDenied";
import PageLoader from "@/components/ui/PageLoader";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { getWorkspace } from "@/hooks/useWorkspace";
import { useRole, can } from "@/hooks/useRole";
import { useProducts, mutateProducts } from "@/hooks/useProducts";
import { useProductLimit } from "@/hooks/useProductLimit";
import { mutateStats } from "@/hooks/useStats";
import { formatBRL, formatQty } from "@/lib/stock";
import {
  lerArquivo, adivinharColunas, validar, baixarModelo, chaveNome, campoInfo, CAMPOS_TELA,
  type Planilha, type Mapa, type Campo, type LinhaValidada, type Situacao,
} from "@/lib/planilha";
import { ArrowLeftIcon, UploadIcon, CheckIcon, Spinner } from "@/components/ui/icons";

/*
 * Importar planilha (EQZ-14): quem já tem o estoque no Excel não cadastra produto por produto.
 * O arquivo é lido aqui no navegador; a pessoa confere as colunas e a prévia e a API grava tudo
 * numa transação (POST /products/import).
 */

const fmt = (n: number) => n.toLocaleString("pt-BR");
const PREVIA = 100; /* linhas mostradas na prévia */

const SITUACAO: Record<Situacao, { label: string; resumo: [string, string]; cls: string }> = {
  ok:        { label: "Pronto",        resumo: ["pronto", "prontos"],                 cls: "bg-ok/15 text-ok" },
  erro:      { label: "Com erro",      resumo: ["com erro", "com erro"],              cls: "bg-zero/15 text-zero" },
  ja_existe: { label: "Já cadastrado", resumo: ["já cadastrado", "já cadastrados"],   cls: "bg-white/10 text-fg-muted" },
  repetido:  { label: "Repetido",      resumo: ["repetido", "repetidos"],             cls: "bg-white/10 text-fg-muted" },
};
const FORA_DO_LIMITE = { label: "Fora do limite", cls: "bg-low/15 text-low" };

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-black">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export default function ImportarPlanilhaPage() {
  const router = useRouter();
  const role   = useRole();

  const [wsId, setWsId]         = useState<string | undefined>(undefined);
  const [wsName, setWsName]     = useState("");
  const [userName, setUserName] = useState("");

  const [arquivo, setArquivo]   = useState("");
  const [planilha, setPlanilha] = useState<Planilha | null>(null);
  const [mapa, setMapa]         = useState<Mapa | null>(null);
  const [lendo, setLendo]       = useState(false);
  const [erroArquivo, setErroArquivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");
  const [resultado, setResultado] = useState<{ criados: number; ignorados: number } | null>(null);
  const [verTudo, setVerTudo]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { products, loading: productsLoading } = useProducts(wsId);
  const limit = useProductLimit(wsId);

  useEffect(() => {
    async function load() {
      const ws = getWorkspace();
      if (!ws) { router.push("/select-workspace"); return; }
      setWsId(ws.id);
      setWsName(ws.name);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
        setUserName(profile?.name ?? user.email?.split("@")[0] ?? "");
      }
    }
    load();
  }, [router]);

  const existentes = useMemo(() => ({
    codigos: new Set(products.map((p) => p.code).filter(Boolean)),
    nomes:   new Set(products.map((p) => chaveNome(p.name))),
  }), [products]);

  const linhas: LinhaValidada[] = useMemo(
    () => (planilha && mapa && mapa.name !== null ? validar(planilha, mapa, existentes) : []),
    [planilha, mapa, existentes],
  );

  const conta = (s: Situacao) => linhas.filter((l) => l.situacao === s).length;
  const prontas = linhas.filter((l) => l.situacao === "ok");
  const capacidade = limit ? Math.max(limit.limit - limit.count, 0) : Infinity;
  const vaoEntrar = prontas.slice(0, capacidade);
  const ficamFora = prontas.length - vaoEntrar.length;
  const entram    = new Set(vaoEntrar.map((l) => l.numero));

  async function escolher(file: File | undefined) {
    if (!file) return;
    setErroArquivo("");
    setErroEnvio("");
    setResultado(null);
    setVerTudo(false);
    setLendo(true);
    try {
      const p = await lerArquivo(file);
      setPlanilha(p);
      setMapa(adivinharColunas(p.cabecalho));
      setArquivo(file.name);
    } catch (err) {
      setPlanilha(null);
      setMapa(null);
      setArquivo("");
      setErroArquivo(err instanceof Error ? err.message : "Não foi possível ler o arquivo.");
    } finally {
      setLendo(false);
      if (inputRef.current) inputRef.current.value = ""; /* deixa escolher o mesmo arquivo de novo */
    }
  }

  function trocarColuna(campo: Campo, valor: string) {
    if (!mapa) return;
    const idx = valor === "" ? null : Number(valor);
    const novo = { ...mapa };
    /* Uma coluna vai para um campo só: tira de onde estava */
    if (idx !== null) {
      for (const c of CAMPOS_TELA) if (novo[c] === idx) novo[c] = null;
    }
    novo[campo] = idx;
    setMapa(novo);
  }

  async function importar() {
    if (!wsId || vaoEntrar.length === 0) return;
    setEnviando(true);
    setErroEnvio("");
    try {
      const r = await api.post<{ criados: number; ignorados: number }>("/products/import", {
        workspace_id: wsId,
        itens: vaoEntrar.map((l) => l.item!),
      });
      setResultado(r);
      mutateProducts(wsId);
      mutateStats(wsId);
    } catch (err) {
      setErroEnvio(err instanceof Error ? err.message : "Não foi possível importar. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  function recomecar() {
    setPlanilha(null);
    setMapa(null);
    setArquivo("");
    setResultado(null);
    setErroEnvio("");
  }

  if (role === null) return <PageLoader />;
  if (!can(role, "canEditEstoque")) return <AccessDenied />;

  /* Exemplo da primeira linha com valor, para a pessoa reconhecer a coluna no seletor */
  const exemplo = (i: number) => {
    const v = planilha?.linhas.find((l) => l[i] !== null && l[i] !== undefined && String(l[i]).trim() !== "")?.[i];
    if (v === undefined || v === null) return "";
    const s = v instanceof Date ? v.toLocaleDateString("pt-BR")
      : typeof v === "number" ? v.toLocaleString("pt-BR", { useGrouping: false, maximumFractionDigits: 3 })
      : String(v).trim();
    return s.length > 24 ? s.slice(0, 24) + "…" : s;
  };

  const visiveis = verTudo ? linhas : linhas.slice(0, PREVIA);

  return (
    <div className="min-h-screen bg-ink">
      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      <main className="lg:pl-64 pt-14 pb-28 lg:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5 lg:gap-6">

          <div className="flex flex-col gap-4">
            <Link href="/estoque" className="w-fit flex items-center gap-2 min-h-[40px] pl-3 pr-4 rounded-full bg-surface text-sm text-fg font-extrabold hover:bg-surface-2 transition-colors">
              <ArrowLeftIcon className="w-4 h-4" strokeWidth={2.4} /> Estoque
            </Link>
            <div className="flex flex-col gap-1">
              <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight leading-tight">Importar planilha</h1>
              <p className="text-sm lg:text-[15px] font-bold text-fg-muted">
                Já tem o estoque no Excel? Traga tudo de uma vez, sem cadastrar produto por produto.
              </p>
            </div>
          </div>

          {resultado ? (
            <section className="bg-surface rounded-5xl px-6 py-10 flex flex-col items-center gap-4 text-center">
              <span className="w-16 h-16 rounded-full bg-ok/15 text-ok flex items-center justify-center">
                <CheckIcon className="w-8 h-8" strokeWidth={2.6} />
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-xl font-black">
                  {resultado.criados === 1 ? "1 produto importado" : `${fmt(resultado.criados)} produtos importados`}
                </p>
                <p className="text-sm font-bold text-fg-muted">
                  {resultado.ignorados > 0
                    ? `${fmt(resultado.ignorados)} ficaram de fora porque o código já estava cadastrado.`
                    : "As quantidades entraram como estoque inicial no histórico de cada produto."}
                </p>
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                <button type="button" onClick={recomecar} className="min-h-[48px] px-5 rounded-full bg-surface-2 text-[15px] font-extrabold cursor-pointer hover:bg-white/10 transition-colors">
                  Importar outra
                </button>
                <Link href="/estoque" className="min-h-[48px] px-6 flex items-center rounded-full bg-accent text-ink text-[15px] font-black hover:brightness-110 transition-[filter]">
                  Ver estoque
                </Link>
              </div>
            </section>
          ) : (
            <>
              <Section
                title="1. Escolha o arquivo"
                aside={
                  <button type="button" onClick={baixarModelo} className="text-[13px] font-extrabold text-accent underline underline-offset-2 cursor-pointer">
                    Baixar modelo
                  </button>
                }
              >
                <p className="text-sm font-bold text-fg-muted leading-relaxed">
                  Excel (.xlsx) ou CSV. A primeira linha precisa ter o nome das colunas. Só o nome do produto é obrigatório;
                  código, quantidade, unidade, preço, custo, mínimo, categoria, fornecedor e local entram se existirem.
                </p>

                <input
                  ref={inputRef}
                  id="importar-arquivo"
                  type="file"
                  accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="sr-only"
                  onChange={(e) => escolher(e.target.files?.[0])}
                />
                <label
                  htmlFor="importar-arquivo"
                  className="min-h-[56px] px-5 rounded-3xl border-2 border-dashed border-white/15 flex items-center justify-center gap-3 cursor-pointer hover:bg-white/5 transition-colors text-[15px] font-extrabold focus-within:ring-2 focus-within:ring-accent"
                >
                  {lendo ? <Spinner /> : <UploadIcon />}
                  {lendo ? "Lendo a planilha…" : arquivo ? `${arquivo} · trocar arquivo` : "Escolher arquivo"}
                </label>

                {erroArquivo && <p role="alert" className="text-sm font-bold text-zero bg-zero/10 rounded-2xl px-4 py-3">{erroArquivo}</p>}

                {limit && (
                  <p className="text-[13px] font-bold text-fg-subtle">
                    {capacidade === 0
                      ? `O plano ${limit.label} está no limite de ${fmt(limit.limit)} produtos.`
                      : `Cabem mais ${fmt(capacidade)} produtos no plano ${limit.label}.`}
                  </p>
                )}
              </Section>

              {planilha && mapa && (
                <Section title="2. Confira as colunas" aside={<span className="text-xs font-extrabold text-fg-subtle">{fmt(planilha.linhas.length)} linhas no arquivo</span>}>
                  <p className="text-sm font-bold text-fg-muted">Achamos as colunas pelo nome. Se alguma estiver errada, troque aqui.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    {CAMPOS_TELA.map((campo) => {
                      const info = campoInfo(campo);
                      const id = `coluna-${campo}`;
                      return (
                        <div key={campo} className="flex flex-col gap-1.5 min-w-0">
                          <label htmlFor={id} className="text-[13px] font-extrabold text-fg-muted">
                            {info.label}{campo === "name" && <span className="text-zero ml-0.5" aria-hidden="true">*</span>}
                          </label>
                          <select
                            id={id}
                            value={mapa[campo] ?? ""}
                            onChange={(e) => trocarColuna(campo, e.target.value)}
                            className={`w-full h-12 px-3 rounded-2xl bg-ink text-[15px] font-semibold outline-hidden focus-visible:ring-2 focus-visible:ring-accent cursor-pointer ${mapa[campo] === null ? "text-fg-subtle" : "text-fg"}`}
                          >
                            <option value="">{campo === "name" ? "Escolha a coluna" : "Não importar"}</option>
                            {planilha.cabecalho.map((h, i) => (
                              <option key={i} value={i}>{h}{exemplo(i) ? ` (ex.: ${exemplo(i)})` : ""}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                  {mapa.name === null && (
                    <p role="alert" className="text-sm font-bold text-low">Escolha qual coluna tem o nome do produto.</p>
                  )}
                  {mapa.qty === null && mapa.name !== null && (
                    <p className="text-[13px] font-bold text-fg-subtle">Sem coluna de quantidade, os produtos entram com estoque 0.</p>
                  )}
                </Section>
              )}

              {planilha && mapa && mapa.name !== null && (
                <Section title="3. Prévia">
                  {productsLoading ? (
                    <div className="h-24 rounded-2xl bg-surface-2 animate-pulse" />
                  ) : (
                    <>
                      <ul className="flex flex-wrap gap-2" aria-label="Resumo">
                        {(["ok", "erro", "ja_existe", "repetido"] as Situacao[]).map((s) => {
                          const n = conta(s);
                          if (n === 0 && s !== "ok") return null;
                          return (
                            <li key={s} className={`px-3 py-1.5 rounded-full text-[13px] font-black ${SITUACAO[s].cls}`}>
                              {fmt(n)} {SITUACAO[s].resumo[n === 1 ? 0 : 1]}
                            </li>
                          );
                        })}
                      </ul>

                      {(conta("ja_existe") > 0 || conta("repetido") > 0) && (
                        <p className="text-[13px] font-bold text-fg-subtle">
                          Já cadastrados (mesmo código ou, sem código, mesmo nome) e linhas repetidas ficam de fora: importar a mesma planilha de novo não duplica nada.
                        </p>
                      )}

                      {ficamFora > 0 && limit && (
                        <div role="alert" className="rounded-3xl px-4 py-3 bg-low/10 ring-1 ring-low/30 flex flex-col gap-1">
                          <p className="text-sm font-black text-low">
                            {capacidade === 0
                              ? `O plano ${limit.label} já está no limite de ${fmt(limit.limit)} produtos.`
                              : `Cabem mais ${fmt(capacidade)} produtos no plano ${limit.label}: vão entrar os ${fmt(capacidade)} primeiros.`}
                          </p>
                          <p className="text-[13px] font-bold text-fg-muted">
                            {fmt(ficamFora)} {ficamFora === 1 ? "fica" : "ficam"} de fora.
                            {limit.nextLabel ? ` No ${limit.nextLabel} cabem até ${fmt(limit.nextLimit!)} produtos.` : ""}
                            {limit.nextLabel && can(role, "canGerenciarAssinatura") && (
                              <> <Link href="/configuracoes" className="text-accent underline underline-offset-2">Ver planos</Link></>
                            )}
                          </p>
                        </div>
                      )}

                      <ul className="flex flex-col">
                        {visiveis.map((l) => {
                          const chip = l.situacao === "ok" && !entram.has(l.numero) ? FORA_DO_LIMITE : SITUACAO[l.situacao];
                          return (
                            <li key={l.numero} className="flex items-start gap-3 py-2.5 border-t-2 border-dashed border-white/6 first:border-t-0">
                              <span className="w-10 shrink-0 pt-0.5 text-[12px] font-extrabold text-fg-subtle tabular-nums">L{l.numero}</span>
                              <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                                <span className={`text-[15px] font-extrabold truncate ${l.nome ? "" : "text-fg-subtle italic"}`}>{l.nome || "Sem nome"}</span>
                                {l.item && (
                                  <span className="text-[13px] font-bold text-fg-muted truncate">
                                    {formatQty(l.item.qty ?? 0)} {l.item.unit}
                                    {l.item.price != null && ` · ${formatBRL(l.item.price)}`}
                                    {l.item.code && ` · ${l.item.code}`}
                                  </span>
                                )}
                                {l.erros.length > 0 && (
                                  <span className="text-[13px] font-bold text-zero">{l.erros.join("; ")}</span>
                                )}
                              </span>
                              <span className={`shrink-0 px-2.5 py-1 rounded-full text-[12px] font-black ${chip.cls}`}>
                                {chip.label}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      {linhas.length > PREVIA && !verTudo && (
                        <button type="button" onClick={() => setVerTudo(true)} className="self-start text-[13px] font-extrabold text-accent underline underline-offset-2 cursor-pointer">
                          Ver as {fmt(linhas.length)} linhas
                        </button>
                      )}
                    </>
                  )}
                </Section>
              )}

              {erroEnvio && <p role="alert" className="text-sm font-bold text-zero bg-zero/10 rounded-2xl px-4 py-3 text-center">{erroEnvio}</p>}

              {planilha && mapa && mapa.name !== null && !productsLoading && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={recomecar}
                    className="flex-1 sm:flex-none sm:w-40 min-h-[54px] rounded-full bg-surface text-[15px] font-extrabold cursor-pointer hover:bg-surface-2 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={importar}
                    disabled={enviando || vaoEntrar.length === 0}
                    className="flex-2 min-h-[54px] rounded-full bg-accent text-ink text-base font-black flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 transition-[filter] disabled:opacity-50"
                  >
                    {enviando
                      ? <><Spinner /> Importando…</>
                      : vaoEntrar.length === 0
                        ? "Nada para importar"
                        : `Importar ${fmt(vaoEntrar.length)} ${vaoEntrar.length === 1 ? "produto" : "produtos"}`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
