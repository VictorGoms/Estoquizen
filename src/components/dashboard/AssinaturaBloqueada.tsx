"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { api } from "@/lib/api";
import { can } from "@/hooks/useRole";
import { guardadoAte, type Subscription } from "@/hooks/useSubscription";
import type { ActiveWorkspace } from "@/hooks/useWorkspace";
import { PLANOS, type PlanoId } from "@/lib/planos";
import { exportProductsCsv, exportMovementsCsv } from "@/lib/exportCsv";
import { Spinner } from "@/components/ui/icons";

/*
 * Tela única de workspace bloqueado (trial vencido sem pagamento, assinatura cancelada ou em
 * exclusão). Substitui as páginas internas: o que dá para fazer é assinar de novo ou levar os
 * dados embora. Perfil, troca de workspace e Configurações continuam abertos.
 */

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" strokeLinecap="round" />
  </svg>
);

function titulo(sub: Subscription): string {
  if (sub.status === "canceled") return "Assinatura cancelada";
  if (sub.status === "deleted") return "Workspace em exclusão";
  /* trial_expired sem data de trial = nunca teve trial (Basic/Pro): o pagamento não foi concluído */
  return sub.trial_ends_at ? "Seu teste grátis acabou" : "Pagamento pendente";
}

export default function AssinaturaBloqueada({ workspace, sub }: { workspace: ActiveWorkspace; sub: Subscription }) {
  const podePagar    = can(workspace.role, "canGerenciarAssinatura");
  const podeExportar = can(workspace.role, "canAccessConfiguracoes");
  const ate          = guardadoAte(sub);

  const [plano, setPlano]         = useState<PlanoId>((PLANOS.some((p) => p.id === sub.plan) ? sub.plan : "growth") as PlanoId);
  const [assinando, setAssinando] = useState(false);
  const [erro, setErro]           = useState("");
  const [exportando, setExportando] = useState<"produtos" | "movimentacoes" | null>(null);
  const [exportMsg, setExportMsg]   = useState("");
  /* Data de hoje só depois de montar (regra do projeto: nada de Date.now() no render) */
  const [agora, setAgora] = useState<number | null>(null);
  useEffect(() => { setAgora(Date.now()); }, []);

  const dias    = ate && agora !== null ? Math.max(0, Math.ceil((ate.getTime() - agora) / (24 * 60 * 60 * 1000))) : null;
  const urgente = dias !== null && dias <= 7;

  async function assinar() {
    setAssinando(true);
    setErro("");
    try {
      const { url } = await api.post<{ url: string }>("/billing/checkout", { workspace_id: workspace.id, plan: plano });
      window.location.assign(url);
    } catch (err) {
      /* Ex.: 409 quando os produtos ou a equipe não cabem no plano escolhido */
      setErro(err instanceof Error ? err.message : "Não foi possível abrir o pagamento. Tente novamente.");
      setAssinando(false);
    }
  }

  async function exportar(what: "produtos" | "movimentacoes") {
    setExportando(what);
    setExportMsg("");
    try {
      const n = what === "produtos"
        ? await exportProductsCsv(workspace.id, workspace.name)
        : await exportMovementsCsv(workspace.id, workspace.name);
      setExportMsg(what === "produtos"
        ? `${n} ${n === 1 ? "produto exportado" : "produtos exportados"}.`
        : `${n} ${n === 1 ? "movimentação exportada" : "movimentações exportadas"}.`);
    } catch (err) {
      setExportMsg(err instanceof Error ? err.message : "Não foi possível exportar. Tente novamente.");
    } finally {
      setExportando(null);
    }
  }

  const escolhido = PLANOS.find((p) => p.id === plano)!;

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center gap-6 px-4 py-10">
      <Link href="/select-workspace" className="flex items-center gap-2.5" aria-label="Estoquizen — trocar de workspace">
        <Logo size={32} />
        <span className="text-lg font-black">Estoquizen</span>
      </Link>

      <main className="w-full max-w-xl bg-surface rounded-5xl p-6 lg:p-8 flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-3">
          <span className="w-16 h-16 rounded-full bg-zero/15 text-zero flex items-center justify-center">
            <LockIcon />
          </span>
          <h1 className="text-[26px] font-black tracking-tight leading-tight">{titulo(sub)}</h1>
          <p className="text-[15px] font-bold text-fg-muted leading-relaxed">
            O workspace <span className="text-fg">{workspace.name}</span> está bloqueado.
          </p>
        </div>

        {/* Prazo da exclusão: o job de limpeza avisa por e-mail no 14º dia e 3 dias antes */}
        {ate && dias !== null && (
          <div
            role={urgente ? "alert" : "status"}
            className={`rounded-4xl px-4 py-3.5 flex items-center gap-4 ring-1 ${urgente ? "bg-zero/15 ring-zero/40" : "bg-low/10 ring-low/30"}`}
          >
            <span className={`min-w-[56px] text-center text-[34px] font-black leading-none tabular-nums ${urgente ? "text-zero" : "text-low"}`}>
              {dias}
            </span>
            <div className="min-w-0">
              <p className={`text-[15px] font-black ${urgente ? "text-zero" : "text-low"}`}>
                {dias === 0
                  ? "Os dados podem ser excluídos a qualquer momento"
                  : `${dias === 1 ? "Falta 1 dia" : `Faltam ${dias} dias`} para os dados serem excluídos`}
              </p>
              <p className="text-[13px] font-bold text-fg-muted mt-0.5">
                Exclusão a partir de {ate.toLocaleDateString("pt-BR")}. Assine de novo ou exporte os dados antes disso.
              </p>
            </div>
          </div>
        )}

        {podePagar ? (
          <section aria-labelledby="bloq-assinar" className="flex flex-col gap-3">
            <h2 id="bloq-assinar" className="text-sm font-extrabold text-fg-muted">Assinar de novo</h2>
            <div role="group" aria-label="Plano" className="grid grid-cols-3 gap-2">
              {PLANOS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={plano === p.id}
                  onClick={() => setPlano(p.id)}
                  className={`min-h-[64px] rounded-3xl px-2 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    plano === p.id ? "bg-inverse text-ink" : "bg-surface-2 hover:bg-white/10"
                  }`}
                >
                  <span className="text-[15px] font-black">{p.name}</span>
                  <span className={`text-[13px] font-bold ${plano === p.id ? "text-inverse-muted" : "text-fg-muted"}`}>{p.price}{p.priceNote}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={assinar}
              disabled={assinando}
              className="min-h-[54px] rounded-full bg-accent text-ink text-base font-black flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 transition-[filter] disabled:opacity-60"
            >
              {assinando ? <><Spinner /> Abrindo o pagamento…</> : `Assinar o ${escolhido.name}`}
            </button>
            {erro && <p role="alert" className="text-sm font-bold text-zero">{erro}</p>}
          </section>
        ) : (
          <p className="px-5 py-3.5 rounded-4xl bg-surface-2 text-sm font-bold text-fg-muted text-center">
            Fale com o dono do workspace para assinar de novo.
          </p>
        )}

        {podeExportar && (
          <section aria-labelledby="bloq-exportar" className="flex flex-col gap-3 pt-5 border-t-2 border-dashed border-white/8">
            <div className="flex flex-col gap-1">
              <h2 id="bloq-exportar" className="text-sm font-extrabold text-fg-muted">Levar os dados</h2>
              <p className="text-[13px] font-bold text-fg-subtle">Planilha (CSV) para abrir no Excel ou no Google Planilhas.</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {(["produtos", "movimentacoes"] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => exportar(w)}
                  disabled={!!exportando}
                  className="min-h-[48px] rounded-full bg-surface-2 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-60"
                >
                  {exportando === w && <Spinner className="w-4 h-4" />}
                  {w === "produtos" ? "Exportar produtos" : "Exportar movimentações"}
                </button>
              ))}
            </div>
            {exportMsg && <p role="status" className="text-sm font-bold text-fg-muted">{exportMsg}</p>}
          </section>
        )}
      </main>

      <nav aria-label="Outras opções" className="flex flex-wrap items-center justify-center gap-1">
        <Link href="/select-workspace" className="min-h-[44px] flex items-center px-4 rounded-full text-sm font-extrabold text-fg-muted hover:text-fg hover:bg-white/5">
          Trocar de workspace
        </Link>
        {podeExportar && (
          <Link href="/configuracoes" className="min-h-[44px] flex items-center px-4 rounded-full text-sm font-extrabold text-fg-muted hover:text-fg hover:bg-white/5">
            Configurações
          </Link>
        )}
        <Link href="/perfil" className="min-h-[44px] flex items-center px-4 rounded-full text-sm font-extrabold text-fg-muted hover:text-fg hover:bg-white/5">
          Perfil
        </Link>
      </nav>
    </div>
  );
}
