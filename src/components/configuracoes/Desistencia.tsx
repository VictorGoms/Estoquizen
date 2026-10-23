"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatBRL } from "@/lib/stock";
import { CONTATO, PRAZO_RESPOSTA } from "@/lib/site";
import { Spinner } from "@/components/ui/icons";

interface Prazo {
  disponivel: boolean;
  /** No prazo, mas a pessoa já desistiu pelo app antes: o pedido vai pelo contato@ (1 vez por pessoa) */
  pelo_contato?: boolean;
  ate:        string | null;
  /** Centavos */
  valor:      number;
}

export interface ResultadoDesistencia {
  /** Devolvido no cartão, em centavos */
  devolvido: number;
  /** Sem estorno automático (boleto), devolvido à mão, em centavos */
  manual:    number;
}

const brl  = (centavos: number) => formatBRL(centavos / 100);
const data =(iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

/**
 * EQZ-50: desistência em até 7 dias do 1º pagamento (CDC art. 49; Decreto 7.962, art. 5º). Só aparece
 * no prazo (a API diz até quando e quanto volta) e não pede motivo: o decreto quer um meio simples.
 * Devolve tudo no cartão e cancela na hora; o workspace fica bloqueado e os dados ficam 30 dias.
 */
export default function Desistencia({ workspaceId, onDesistiu }: {
  workspaceId: string;
  onDesistiu:  (r: ResultadoDesistencia) => void;
}) {
  const [prazo, setPrazo]             = useState<Prazo | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [agindo, setAgindo]           = useState(false);
  const [erro, setErro]               = useState("");

  useEffect(() => {
    let vivo = true;
    api.get<Prazo>(`/billing/desistencia?workspace_id=${workspaceId}`)
      .then((p) => { if (vivo) setPrazo(p); })
      .catch(() => undefined);
    return () => { vivo = false; };
  }, [workspaceId]);

  if (!prazo?.ate) return null;

  if (!prazo.disponivel) {
    if (!prazo.pelo_contato) return null;
    return (
      <div className="bg-surface-2 rounded-4xl p-4 lg:p-5 flex flex-col gap-1">
        <p className="text-[15px] font-black">Mudou de ideia? Dá para desistir até {data(prazo.ate)}</p>
        <p className="text-sm font-bold text-fg-muted">
          Você já usou a desistência pelo app uma vez, então este pedido é pelo e-mail: escreva para{" "}
          <a href={`mailto:${CONTATO}?subject=${encodeURIComponent("Desistência da assinatura")}`} className="text-accent underline underline-offset-2">{CONTATO}</a>
          {" "}e respondemos em até {PRAZO_RESPOSTA}.
        </p>
      </div>
    );
  }

  async function desistir() {
    setAgindo(true);
    setErro("");
    try {
      onDesistiu(await api.post<ResultadoDesistencia>("/billing/desistir", { workspace_id: workspaceId }));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível desistir agora. Tente novamente.");
      setAgindo(false);
    }
  }

  return (
    <div className="bg-surface-2 rounded-4xl p-4 lg:p-5 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-[15px] font-black">Mudou de ideia? Dá para desistir até {data(prazo.ate)}</p>
        <p className="text-sm font-bold text-fg-muted">
          Nos 7 dias depois do primeiro pagamento, você cancela e recebe {brl(prazo.valor)} de volta no cartão.
          A assinatura acaba na hora: o workspace fica bloqueado e os dados ficam guardados por 30 dias (dá para exportar).
        </p>
      </div>

      {confirmando && (
        <p role="alertdialog" aria-label="Confirmar desistência" className="bg-zero/10 ring-1 ring-zero/30 rounded-3xl p-4 text-sm font-bold text-fg-muted">
          Confirmar a desistência? Devolvemos {brl(prazo.valor)} e o workspace fica bloqueado agora, não no fim do mês.
        </p>
      )}

      {erro && <p role="alert" className="text-sm font-bold text-zero">{erro}</p>}

      <div className="flex flex-wrap gap-2.5">
        {confirmando ? (
          <>
            <button
              type="button"
              onClick={desistir}
              disabled={agindo}
              className="min-h-[44px] px-5 rounded-full bg-zero text-ink text-sm font-black cursor-pointer hover:brightness-110 transition-[filter] disabled:opacity-60 flex items-center gap-2"
            >
              {agindo && <Spinner className="w-4 h-4" />}
              {agindo ? "Devolvendo…" : "Confirmar desistência"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              disabled={agindo}
              className="min-h-[44px] px-5 rounded-full text-sm font-extrabold text-fg-muted cursor-pointer hover:bg-white/5 hover:text-fg transition-colors"
            >
              Voltar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="min-h-[44px] px-5 rounded-full bg-ink text-sm font-black text-fg cursor-pointer hover:bg-panel transition-colors"
          >
            Desistir e receber o valor de volta
          </button>
        )}
      </div>
    </div>
  );
}
