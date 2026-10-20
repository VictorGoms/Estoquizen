"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { PLAN_INFO } from "@/hooks/usePlan";
import { PLANOS } from "@/lib/planos";
import { inputClass } from "@/components/ui/FormField";
import { Spinner } from "@/components/ui/icons";

type Plan = "basic" | "growth" | "pro";
const ORDEM: Plan[] = ["basic", "growth", "pro"];

/* A única pergunta do cancelamento (EQZ-07); os valores são os do CHECK de cancel_feedback */
const MOTIVOS = [
  { id: "caro",           label: "Está caro para mim" },
  { id: "pouco_uso",      label: "Não estou usando o suficiente" },
  { id: "negocio_parado", label: "Meu negócio está parado ou fechou" },
  { id: "faltou_recurso", label: "Faltou um recurso" },
  { id: "outro_sistema",  label: "Vou usar outro sistema ou planilha" },
  { id: "outro",          label: "Outro motivo" },
] as const;
type Motivo = (typeof MOTIVOS)[number]["id"];

const DETALHE: Partial<Record<Motivo, string>> = {
  faltou_recurso: "O que faltou? (opcional)",
  outro_sistema:  "Qual? (opcional)",
  outro:          "Conte rapidinho (opcional)",
};

interface CancelamentoProps {
  workspaceId:  string;
  plan:         Plan;
  productCount: number;
  /** Ativos + convites pendentes; null se não deu para ler */
  memberCount:  number | null;
  /** Data da próxima mensalidade (a que a pausa pula) */
  proximaCobranca: string | null;
  pausaDisponivel: boolean;
  onCancelar: () => void;
  onDescer:   (plan: Plan) => void;
  onPausado:  (pausedUntil: string) => void;
  onFechar:   () => void;
}

const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : null);

/**
 * Antes de abrir o cancelamento do Stripe: 1 pergunta e, conforme o motivo, uma oferta.
 * "Caro" oferece o plano mais barato que caiba no uso; "pouco uso" e "negócio parado" oferecem
 * pausar a cobrança por 1 mês (1 vez por ano). A resposta vai para cancel_feedback.
 */
export default function Cancelamento(props: CancelamentoProps) {
  const { workspaceId, plan, productCount, memberCount, proximaCobranca, pausaDisponivel } = props;
  const [motivo, setMotivo]     = useState<Motivo | null>(null);
  const [detalhe, setDetalhe]   = useState("");
  const [agindo, setAgindo]     = useState<"cancelar" | "pausar" | "trocar_plano" | null>(null);
  const [erro, setErro]         = useState("");

  /* Plano mais barato abaixo do atual em que produtos e equipe cabem */
  const descerPara = ORDEM.slice(0, ORDEM.indexOf(plan)).find((p) => {
    const info = PLAN_INFO[p];
    return productCount <= info.produtos && (info.membros === null || memberCount === null || memberCount <= info.membros);
  }) ?? null;

  const oferta: "descer" | "pausar" | null =
    motivo === "caro"
      ? (descerPara ? "descer" : pausaDisponivel ? "pausar" : null)
      : motivo === "pouco_uso" || motivo === "negocio_parado"
      ? (pausaDisponivel ? "pausar" : descerPara ? "descer" : null)
      : null;

  /* Guardar a resposta não pode travar a ação: se falhar, segue */
  async function registrar(acao: "cancelar" | "pausar" | "trocar_plano") {
    if (!motivo) return;
    await api.post("/billing/cancel-feedback", {
      workspace_id: workspaceId, motivo, acao,
      ...(detalhe.trim() && DETALHE[motivo] ? { detalhe: detalhe.trim() } : {}),
    }).catch(() => undefined);
  }

  async function cancelar() {
    setAgindo("cancelar");
    await registrar("cancelar");
    props.onCancelar();
  }

  async function descer() {
    if (!descerPara) return;
    setAgindo("trocar_plano");
    await registrar("trocar_plano");
    props.onDescer(descerPara);
  }

  async function pausar() {
    setAgindo("pausar");
    setErro("");
    await registrar("pausar");
    try {
      const r = await api.post<{ paused_until: string }>("/billing/pause", { workspace_id: workspaceId });
      props.onPausado(r.paused_until);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível pausar a cobrança. Tente novamente.");
      setAgindo(null);
    }
  }

  const alvo  = descerPara ? PLAN_INFO[descerPara] : null;
  const venda = descerPara ? PLANOS.find((x) => x.id === descerPara) : null;

  return (
    <div className="bg-surface-2 rounded-4xl p-4 lg:p-5 flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2.5">
        <legend className="text-[15px] font-black mb-2.5">Antes de cancelar: por que você quer sair?</legend>
        <div className="flex flex-wrap gap-2">
          {MOTIVOS.map((m) => (
            <label key={m.id} className="cursor-pointer">
              <input
                type="radio"
                name="motivo-cancelamento"
                value={m.id}
                checked={motivo === m.id}
                onChange={() => { setMotivo(m.id); setErro(""); }}
                className="peer sr-only"
              />
              <span className="flex items-center min-h-[44px] px-4 rounded-full bg-ink text-sm font-extrabold text-fg-soft transition-colors peer-checked:bg-inverse peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-accent hover:text-fg">
                {m.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {motivo && DETALHE[motivo] && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-extrabold text-fg-muted">{DETALHE[motivo]}</span>
          <textarea
            value={detalhe}
            onChange={(e) => setDetalhe(e.target.value.slice(0, 500))}
            rows={3}
            maxLength={500}
            className={`${inputClass} resize-none py-3`}
          />
        </label>
      )}

      {oferta === "descer" && alvo && venda && (
        <div className="bg-ink rounded-3xl p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-[15px] font-black">Que tal o {alvo.label}, por {venda.price}{venda.priceNote}?</p>
            <p className="text-sm font-bold text-fg-muted">
              O seu uso cabe nele: {productCount.toLocaleString("pt-BR")} produtos (até {alvo.produtos.toLocaleString("pt-BR")})
              {memberCount !== null && alvo.membros !== null ? ` e equipe de ${memberCount} (até ${alvo.membros})` : ""}.
              A mudança vale na hora e o valor não usado vira crédito.
            </p>
          </div>
          <button
            type="button"
            onClick={descer}
            disabled={!!agindo}
            className="self-start min-h-[44px] px-5 rounded-full bg-accent text-ink text-sm font-black cursor-pointer hover:brightness-110 transition-[filter] disabled:opacity-60"
          >
            {agindo === "trocar_plano" ? "Aguarde…" : `Ver como fica no ${alvo.label}`}
          </button>
        </div>
      )}

      {oferta === "pausar" && (
        <div className="bg-ink rounded-3xl p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-[15px] font-black">Pausar a cobrança por 1 mês</p>
            <p className="text-sm font-bold text-fg-muted">
              {data(proximaCobranca) ? `A mensalidade de ${data(proximaCobranca)} não é cobrada. ` : "A próxima mensalidade não é cobrada. "}
              O acesso continua normal e os dados ficam. Depois a cobrança volta sozinha. Dá para usar uma vez por ano.
            </p>
          </div>
          <button
            type="button"
            onClick={pausar}
            disabled={!!agindo}
            className="self-start min-h-[44px] px-5 rounded-full bg-accent text-ink text-sm font-black cursor-pointer hover:brightness-110 transition-[filter] disabled:opacity-60 flex items-center gap-2"
          >
            {agindo === "pausar" && <Spinner className="w-4 h-4" />}
            {agindo === "pausar" ? "Pausando…" : "Pausar 1 mês"}
          </button>
        </div>
      )}

      {erro && <p role="alert" className="text-sm font-bold text-zero">{erro}</p>}

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={cancelar}
          disabled={!motivo || !!agindo}
          className="min-h-[44px] px-5 rounded-full bg-ink text-sm font-black text-fg cursor-pointer hover:bg-panel transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {agindo === "cancelar" ? "Abrindo…" : "Continuar com o cancelamento"}
        </button>
        <button
          type="button"
          onClick={props.onFechar}
          disabled={!!agindo}
          className="min-h-[44px] px-5 rounded-full text-sm font-extrabold text-fg-muted cursor-pointer hover:bg-white/5 hover:text-fg transition-colors"
        >
          Voltar
        </button>
      </div>
      {!motivo && <p className="text-[13px] font-bold text-fg-subtle -mt-2">Escolha um motivo para continuar.</p>}
    </div>
  );
}
