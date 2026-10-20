"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import AccessDenied from "@/components/ui/AccessDenied";
import PageLoader from "@/components/ui/PageLoader";
import ProductAvatar from "@/components/estoque/ProductAvatar";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { getWorkspace } from "@/hooks/useWorkspace";
import { useRole, can } from "@/hooks/useRole";
import { useProducts, mutateProducts } from "@/hooks/useProducts";
import { useProductLimit } from "@/hooks/useProductLimit";
import { mutateStats } from "@/hooks/useStats";
import { chaveNome } from "@/lib/planilha";
import { SEGMENTOS, segmentoInfo, type Segmento } from "@/lib/segmentos";
import { formatQty } from "@/lib/stock";
import { ArrowLeftIcon, CheckIcon, Spinner } from "@/components/ui/icons";

/*
 * Lista pronta do ramo (EQZ-13): os produtos mais comuns do segmento, com mínimo sugerido e
 * quantidade 0, para o estoque não começar vazio. Grava pela mesma rota da planilha
 * (POST /products/import). O segmento vem do cadastro da empresa; quem não escolheu escolhe aqui.
 */

const COM_MODELO = SEGMENTOS.filter((s) => s.modelo.length > 0);

export default function ModeloPage() {
  const router = useRouter();
  const role   = useRole();

  const [wsId, setWsId]         = useState<string | undefined>(undefined);
  const [wsName, setWsName]     = useState("");
  const [userName, setUserName] = useState("");
  /* Segmento gravado no workspace (null = não escolheu) e o que está na tela */
  const [gravado, setGravado]   = useState<Segmento | null | undefined>(undefined);
  const [segmento, setSegmento] = useState<Segmento | null>(null);
  const [desmarcados, setDesmarcados] = useState<Set<string>>(new Set());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro]         = useState("");
  const [resultado, setResultado] = useState<{ criados: number; ignorados: number } | null>(null);

  const { products, loading: productsLoading } = useProducts(wsId);
  const limit = useProductLimit(wsId);

  useEffect(() => {
    async function load() {
      const ws = getWorkspace();
      if (!ws) { router.push("/select-workspace"); return; }
      setWsId(ws.id);
      setWsName(ws.name);
      const [{ data: { user } }, { data: w }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("workspaces").select("segment").eq("id", ws.id).single(),
      ]);
      const seg = (w?.segment ?? null) as Segmento | null;
      setGravado(seg);
      setSegmento(seg && segmentoInfo(seg)?.modelo.length ? seg : null);
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
        setUserName(profile?.name ?? user.email?.split("@")[0] ?? "");
      }
    }
    load();
  }, [router]);

  const info = segmentoInfo(segmento);
  const jaTem = useMemo(() => new Set(products.map((p) => chaveNome(p.name))), [products]);
  const itens = useMemo(
    () => (info?.modelo ?? []).filter((i) => !jaTem.has(chaveNome(i.nome))),
    [info, jaTem],
  );
  const escolhidos = itens.filter((i) => !desmarcados.has(i.nome));
  /* null enquanto o limite carrega: não trava o botão por isso (a API confere de novo) */
  const cabem      = limit ? limit.limit - limit.count : Infinity;

  function trocarSegmento(s: Segmento) {
    setSegmento(s);
    setDesmarcados(new Set());
    setErro("");
  }

  function alternar(nome: string) {
    setDesmarcados((d) => {
      const n = new Set(d);
      if (n.has(nome)) n.delete(nome); else n.add(nome);
      return n;
    });
  }

  async function adicionar() {
    if (!wsId || !segmento || escolhidos.length === 0) return;
    setEnviando(true);
    setErro("");
    try {
      const r = await api.post<{ criados: number; ignorados: number }>("/products/import", {
        workspace_id: wsId,
        itens: escolhidos.map((i) => ({ name: i.nome, unit: i.unidade, min_qty: i.minimo, qty: 0 })),
      });
      /* Quem ainda não tinha segmento fica com o que escolheu aqui (ordena as unidades no cadastro) */
      if (!gravado) await api.patch(`/workspaces/${wsId}`, { segment: segmento }).catch(() => undefined);
      mutateProducts(wsId);
      mutateStats(wsId);
      setResultado(r);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível adicionar os produtos. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  if (role === null || gravado === undefined) return <PageLoader />;
  if (!can(role, "canEditEstoque")) return <AccessDenied />;

  const termo = info?.termo ?? "produtos";

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
              <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight leading-tight">Lista pronta do seu ramo</h1>
              <p className="text-sm lg:text-[15px] font-bold text-fg-muted">
                Os itens mais comuns, já com um mínimo sugerido. Marque o que você trabalha e ajuste depois.
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
                  {resultado.criados === 1 ? `1 item adicionado` : `${resultado.criados} ${termo} adicionados`}
                </p>
                <p className="text-sm font-bold text-fg-muted">
                  Tudo começa com quantidade 0. Dê entrada no que você tem hoje (pelo scanner ou no botão ±) e o
                  alerta de mínimo passa a valer.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2.5">
                <Link href="/estoque" className="min-h-[48px] px-6 flex items-center rounded-full bg-accent text-ink text-[15px] font-black hover:brightness-110 transition-[filter]">
                  Ver o estoque
                </Link>
                <Link href="/scanner" className="min-h-[48px] px-6 flex items-center rounded-full bg-surface-2 text-[15px] font-extrabold hover:bg-white/10 transition-colors">
                  Dar entrada pelo scanner
                </Link>
              </div>
            </section>
          ) : (
            <>
              <section aria-labelledby="modelo-ramo" className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-3">
                <h2 id="modelo-ramo" className="text-sm font-extrabold text-fg-muted">
                  {gravado && gravado === segmento ? "Seu ramo" : "Escolha o seu ramo"}
                </h2>
                <div role="radiogroup" aria-labelledby="modelo-ramo" className="flex flex-wrap gap-2">
                  {COM_MODELO.map((s) => {
                    const ativo = segmento === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="radio"
                        aria-checked={ativo}
                        onClick={() => trocarSegmento(s.id)}
                        className={`min-h-[44px] px-4 rounded-full text-sm font-extrabold cursor-pointer transition-colors ${
                          ativo ? "bg-inverse text-ink" : "bg-surface-2 text-fg-soft hover:text-fg"
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
                {gravado === "outro" && !segmento && (
                  <p className="text-[13px] font-bold text-fg-subtle">
                    Ainda não temos lista pronta para o seu ramo. Escolha o mais parecido ou importe a sua planilha.
                  </p>
                )}
              </section>

              {info && (
                <section aria-labelledby="modelo-itens" className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <h2 id="modelo-itens" className="text-lg font-black">
                      {itens.length === 0 ? `Você já tem todos estes ${termo}` : `${escolhidos.length} de ${itens.length} ${termo} marcados`}
                    </h2>
                    <p className="text-[13px] font-bold text-fg-muted">{info.dica}</p>
                  </div>

                  {productsLoading ? (
                    <p className="flex items-center gap-2 text-sm font-bold text-fg-muted"><Spinner className="w-4 h-4" /> Conferindo o seu estoque…</p>
                  ) : itens.length > 0 && (
                    <ul className="flex flex-col">
                      {itens.map((i) => {
                        const marcado = !desmarcados.has(i.nome);
                        return (
                          <li key={i.nome} className="border-t-2 border-dashed border-white/8 first:border-t-0">
                            <label className="flex items-center gap-3 py-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={marcado}
                                onChange={() => alternar(i.nome)}
                                className="w-5 h-5 accent-[#60a5fa] shrink-0 cursor-pointer"
                              />
                              <ProductAvatar name={i.nome} imageUrl={null} />
                              <span className="flex-1 min-w-0 flex flex-col">
                                <span className={`text-[15px] font-extrabold truncate ${marcado ? "" : "text-fg-subtle line-through"}`}>{i.nome}</span>
                                <span className="text-[13px] font-bold text-fg-muted">Mínimo {formatQty(i.minimo)} {i.unidade}</span>
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {escolhidos.length > cabem && (
                    <p role="alert" className="text-sm font-bold text-low">
                      O seu plano ainda cabe {Math.max(cabem, 0)} {Math.max(cabem, 0) === 1 ? "produto" : "produtos"}: desmarque {escolhidos.length - Math.max(cabem, 0)} para continuar.
                    </p>
                  )}
                  {erro && <p role="alert" className="text-sm font-bold text-zero">{erro}</p>}

                  {itens.length > 0 && (
                    <button
                      type="button"
                      onClick={adicionar}
                      disabled={enviando || escolhidos.length === 0 || escolhidos.length > cabem}
                      className="min-h-[54px] rounded-full bg-accent text-ink text-base font-black flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 transition-[filter] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {enviando && <Spinner className="w-5 h-5" />}
                      {enviando ? "Adicionando…" : `Adicionar ${escolhidos.length} ${escolhidos.length === 1 ? "item" : termo}`}
                    </button>
                  )}
                </section>
              )}

              <p className="text-[13px] font-bold text-fg-subtle text-center">
                Já tem uma lista sua? <Link href="/estoque/importar" className="underline underline-offset-2 hover:text-fg">Importe a planilha</Link>.
              </p>
            </>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
