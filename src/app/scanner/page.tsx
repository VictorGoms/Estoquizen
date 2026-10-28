"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BarcodeScanner from "@/components/ui/BarcodeScanner";
import ProductAvatar from "@/components/estoque/ProductAvatar";
import StatusChip from "@/components/estoque/StatusChip";
import MovementForm, { type MovementType } from "@/components/estoque/MovementForm";
import MovimentarVarios from "@/components/estoque/MovimentarVarios";
import BuscaProduto from "@/components/estoque/BuscaProduto";
import { supabase } from "@/lib/supabase";
import { getWorkspace } from "@/hooks/useWorkspace";
import { useRole, can } from "@/hooks/useRole";
import { useProducts, mutateProducts } from "@/hooks/useProducts";
import { mutateStats } from "@/hooks/useStats";
import { mutateMovements } from "@/hooks/useMovements";
import { sanitizeCode } from "@/lib/sanitize";
import { deriveStatus, formatQty } from "@/lib/stock";
import { ArrowLeftIcon, InIcon, OutIcon, ScanIcon, CheckIcon, SearchIcon, Spinner } from "@/components/ui/icons";

type Step = "scanning" | "confirm" | "success" | "not_found";

interface FoundProduct {
  id: string;
  name: string;
  code: string;
  qty: number;
  unit: string;
  min_qty: number;
  location: string | null;
  image_url: string | null;
  icon: string | null;
}

const REASON_FALLBACK: Record<MovementType, string> = {
  entrada: "Entrada via scanner",
  saida:   "Saída via scanner",
};
type Jeito = "nome" | "camera";
const CHAVE_JEITO = "estoquizen_movimentar_jeito";

const REASON_PELO_NOME: Record<MovementType, string> = {
  entrada: "Entrada",
  saida:   "Saída",
};

export default function ScannerPage() {
  const router  = useRouter();
  const role    = useRole();
  /* Entrada e saída: todos os papéis (SCRUM-62). Cadastrar o código novo: só dono e admin */
  const canEdit = can(role, "canEditEstoque");
  const canMove = can(role, "canMovimentar");

  const [step, setStep]               = useState<Step>("scanning");
  const [mode, setMode]               = useState<MovementType>("entrada");
  const [product, setProduct]         = useState<FoundProduct | null>(null);
  const [scannedCode, setScannedCode] = useState("");
  const [result, setResult]           = useState<{ delta: number; newQty: number } | null>(null);
  const [looking, setLooking]         = useState(false);
  const [errorMsg, setErrorMsg]       = useState("");
  /* Refs para o handler da câmera não mudar de identidade (o que reiniciaria a câmera) */
  const modeRef    = useRef<MovementType>("entrada");
  const canEditRef = useRef(false);
  useEffect(() => { canEditRef.current = canEdit; }, [canEdit]);

  /* EQZ-69: "um" produto por vez ou "varios" de uma vez (lista + registro único). A escolha "Entrada
     e saída" (tela inicial e Estoque) abre com ?tipo=entrada|saida&modo=um|varios */
  const [quantos, setQuantos]         = useState<"um" | "varios">("um");
  const [wsId, setWsId]               = useState<string | null>(null);
  /* Como achar o produto (pedido do João: com a câmera sempre na tela, quem não tem código de barras
     achava que só dava por ela). "nome" é o padrão; a escolha fica neste aparelho. ?jeito=camera
     (botão "Escanear" da barra) abre direto na câmera sem mudar a escolha guardada */
  const [jeito, setJeito]             = useState<Jeito>("nome");
  /* Busca pelo nome, para quem não tem código de barras */
  const { products, loading: carregandoProdutos } = useProducts(wsId ?? undefined);
  useEffect(() => {
    setWsId(getWorkspace()?.id ?? null);
    const params = new URLSearchParams(window.location.search);
    if (params.get("modo") === "varios") setQuantos("varios");
    const tipo = params.get("tipo");
    if (tipo === "entrada" || tipo === "saida") { modeRef.current = tipo; setMode(tipo); }
    const pedido = params.get("jeito");
    if (pedido === "camera" || pedido === "nome") { setJeito(pedido); return; }
    try {
      const salvo = localStorage.getItem(CHAVE_JEITO);
      if (salvo === "camera" || salvo === "nome") setJeito(salvo);
    } catch { /* navegador sem armazenamento */ }
  }, []);

  function trocarJeito(j: Jeito) {
    setJeito(j);
    try { localStorage.setItem(CHAVE_JEITO, j); } catch { /* navegador sem armazenamento */ }
  }

  /* Escolhido pela busca: vai direto para a quantidade, como se tivesse lido o código */
  function escolherPeloNome(p: (typeof products)[number]) {
    setScannedCode("");
    setErrorMsg("");
    setProduct({
      id: p.id, name: p.name, code: p.code, qty: Number(p.qty), unit: p.unit, min_qty: Number(p.min_qty ?? 0),
      location: p.location, image_url: p.image_url, icon: p.icon,
    });
    setStep("confirm");
  }

  function changeMode(m: MovementType) {
    modeRef.current = m;
    setMode(m);
  }

  const handleDetect = useCallback(async (code: string) => {
    const trimmed = sanitizeCode(code);
    setScannedCode(trimmed);
    setErrorMsg("");
    setLooking(true);

    const ws = getWorkspace();
    if (!ws) { router.push("/select-workspace"); return; }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }

    const { data, error } = await supabase
      .from("products")
      .select("id, name, code, qty, unit, min_qty, location, image_url, icon")
      .eq("workspace_id", ws.id)
      .ilike("code", trimmed)
      .maybeSingle();

    setLooking(false);

    if (error) {
      setErrorMsg(`Erro ao buscar produto: ${error.message}`);
      setStep("not_found");
      return;
    }

    if (data) {
      setProduct({ ...data, qty: Number(data.qty), min_qty: Number(data.min_qty ?? 0) } as FoundProduct);
      setStep("confirm");
    } else if (modeRef.current === "entrada" && canEditRef.current) {
      router.push(`/estoque/novo?code=${encodeURIComponent(trimmed)}`);
    } else {
      setStep("not_found");
    }
  }, [router]);

  function scanAgain() {
    setStep("scanning");
    setProduct(null);
    setScannedCode("");
    setResult(null);
    setErrorMsg("");
  }

  function handleDone(newQty: number, delta: number) {
    setResult({ newQty, delta });
    setProduct((p) => (p ? { ...p, qty: newQty } : p));
    const ws = getWorkspace();
    if (ws) {
      mutateProducts(ws.id);
      mutateStats(ws.id);
      mutateMovements(ws.id);
    }
    setStep("success");
  }

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-md mx-auto px-5 pt-6 pb-10 flex flex-col gap-4">

        <header className="flex items-center justify-between gap-3">
          <Link
            href="/dashboard"
            aria-label="Voltar ao início"
            className="w-12 h-12 rounded-full bg-surface text-fg flex items-center justify-center shrink-0 hover:bg-surface-2 transition-colors"
          >
            <ArrowLeftIcon className="w-[22px] h-[22px]" strokeWidth={2.2} />
          </Link>
          <h1 className="text-lg font-black">Entrada e saída</h1>
          <span className="w-12" aria-hidden="true" />
        </header>

        <div role="group" aria-label="Quantos produtos" className="flex gap-1 p-1 rounded-full bg-surface">
          {([
            { id: "um",     label: "Um produto" },
            { id: "varios", label: "Vários de uma vez" },
          ] as const).map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={quantos === o.id}
              onClick={() => { setQuantos(o.id); scanAgain(); }}
              className={`flex-1 min-h-[40px] rounded-full text-sm cursor-pointer transition-colors duration-200 ${
                quantos === o.id ? "bg-inverse text-ink font-black" : "text-fg-muted font-extrabold hover:text-fg"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div role="group" aria-label="Tipo de movimentação" className="flex gap-1 p-[5px] rounded-full bg-surface">
          {(["entrada", "saida"] as const).map((t) => {
            const active = mode === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={active}
                onClick={() => changeMode(t)}
                className={`flex-1 min-h-[46px] rounded-full text-base flex items-center justify-center gap-2 cursor-pointer transition-colors duration-200 ${
                  active ? "bg-accent text-ink font-black" : "text-fg-soft font-extrabold hover:text-fg"
                }`}
              >
                {t === "entrada" ? <InIcon className="w-[18px] h-[18px]" strokeWidth={2.4} /> : <OutIcon className="w-[18px] h-[18px]" strokeWidth={2.2} />}
                {t === "entrada" ? "Entrada" : "Saída"}
              </button>
            );
          })}
        </div>

        {/* Como achar o produto: a câmera só abre para quem escolher o código de barras */}
        {(quantos === "varios" || step === "scanning") && (
          <fieldset className="flex flex-col gap-2">
            <legend className="text-[13px] font-extrabold text-fg-muted mb-2 px-1">Como achar o produto?</legend>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: "nome",   label: "Pelo nome",       Icon: SearchIcon },
                { id: "camera", label: "Código de barras", Icon: ScanIcon },
              ] as const).map((o) => {
                const ativo = jeito === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => trocarJeito(o.id)}
                    className={`min-h-[48px] px-3 rounded-full text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                      ativo ? "bg-surface-2 text-fg font-black ring-2 ring-accent" : "bg-surface text-fg-muted font-extrabold hover:text-fg"
                    }`}
                  >
                    <o.Icon className="w-[18px] h-[18px] shrink-0" />
                    {o.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {quantos === "varios" && (
          wsId && canMove
            ? <MovimentarVarios workspaceId={wsId} tipo={mode} podeCadastrar={canEdit} camera={jeito === "camera"} />
            : role !== null && <p className="text-sm font-bold text-fg-muted text-center">Escolha um workspace para continuar.</p>
        )}

        {quantos === "um" && step === "scanning" && (
          looking ? (
            <div className="h-[260px] rounded-5xl bg-surface flex items-center justify-center gap-3 text-fg-muted font-bold">
              <Spinner /> Buscando produto…
            </div>
          ) : jeito === "camera" ? (
            <BarcodeScanner variant="embedded" onDetect={handleDetect} />
          ) : (
            canMove && (
              <BuscaProduto
                produtos={products}
                carregando={carregandoProdutos}
                onEscolher={escolherPeloNome}
                onCodigoDesconhecido={(c) => void handleDetect(c)}
                rotulo="Nome do produto"
              />
            )
          )
        )}

        {step !== "scanning" && (scannedCode || (step === "confirm" && product)) && (
          <div className="flex items-center gap-3 p-2 pl-4 rounded-full bg-surface">
            {scannedCode ? <ScanIcon className="w-5 h-5 text-accent shrink-0" /> : <SearchIcon className="w-5 h-5 text-accent shrink-0" />}
            <span className="flex-1 min-w-0 text-sm font-extrabold text-fg tracking-wide truncate">
              {scannedCode ? <><span className="sr-only">Código lido: </span>{scannedCode}</> : "Escolhido pelo nome"}
            </span>
            <button
              type="button"
              onClick={scanAgain}
              className="min-h-[44px] px-4 rounded-full bg-surface-2 text-sm font-extrabold shrink-0 cursor-pointer hover:bg-white/10"
            >
              {scannedCode ? "Escanear outro" : "Escolher outro"}
            </button>
          </div>
        )}

        {step === "confirm" && product && (
          <section aria-label="Confirmar movimentação" className="bg-surface rounded-[30px] p-[18px] flex flex-col gap-3.5">
            <div className="flex items-center gap-3">
              <ProductAvatar name={product.name} imageUrl={product.image_url} icon={product.icon} />
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <p className="text-[17px] font-black truncate">{product.name}</p>
                <p className="text-[13px] font-bold text-fg-muted truncate">{product.location || product.code}</p>
              </div>
              <StatusChip status={deriveStatus(product.qty, product.min_qty)} />
            </div>
            {canMove ? (
              <MovementForm
                key={product.id}
                product={product}
                type={mode}
                onTypeChange={changeMode}
                hideTypeToggle
                reasonFallback={scannedCode ? REASON_FALLBACK : REASON_PELO_NOME}
                onDone={handleDone}
              />
            ) : (
              <p className="rounded-[20px] bg-surface-2 px-4 py-3 text-sm font-bold text-fg-muted">
                Em estoque: <span className="text-fg font-black">{formatQty(product.qty)} {product.unit}</span>
              </p>
            )}
          </section>
        )}

        {step === "success" && product && result && (
          <section className="bg-surface rounded-[30px] p-6 flex flex-col items-center gap-4 text-center" aria-live="polite">
            <span className="w-16 h-16 rounded-full bg-accent text-ink flex items-center justify-center">
              <CheckIcon className="w-8 h-8" strokeWidth={2.6} />
            </span>
            <div>
              <p className="text-xl font-black">{result.delta > 0 ? "Entrada registrada" : "Saída registrada"}</p>
              <p className="text-sm font-bold text-fg-muted mt-1">
                {product.name} · {result.delta > 0 ? "+" : "−"}{formatQty(Math.abs(result.delta))} {product.unit} · agora {formatQty(result.newQty)} {product.unit}
              </p>
            </div>
            <div className="w-full flex flex-col gap-2.5">
              <button
                type="button"
                onClick={scanAgain}
                className="min-h-[54px] rounded-full bg-accent text-ink text-base font-black flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 transition-[filter]"
              >
                <ScanIcon /> Próximo produto
              </button>
              <Link
                href={`/estoque/${product.id}`}
                className="min-h-[48px] rounded-full bg-surface-2 text-[15px] font-extrabold flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                Ver produto
              </Link>
            </div>
          </section>
        )}

        {step === "not_found" && (
          <section className="bg-surface rounded-[30px] p-6 flex flex-col items-center gap-3 text-center">
            <span className="w-16 h-16 rounded-full bg-surface-2 text-fg-muted flex items-center justify-center">
              <SearchIcon className="w-7 h-7" />
            </span>
            <p className="text-lg font-black">Produto não encontrado</p>
            <p className="text-sm font-bold text-fg-muted">
              {errorMsg
                ? <span className="text-zero">{errorMsg}</span>
                : <>O código <span className="text-fg tracking-wide">{scannedCode}</span> não está cadastrado neste workspace.</>}
            </p>
            <div className="w-full flex flex-col gap-2.5 mt-1">
              <button
                type="button"
                onClick={scanAgain}
                className="min-h-[54px] rounded-full bg-accent text-ink text-base font-black cursor-pointer hover:brightness-110 transition-[filter]"
              >
                Escanear novamente
              </button>
              {canEdit && scannedCode && (
                <Link
                  href={`/estoque/novo?code=${encodeURIComponent(scannedCode)}`}
                  className="min-h-[48px] rounded-full bg-surface-2 text-[15px] font-extrabold flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  Cadastrar produto com este código
                </Link>
              )}
              {role !== null && !canEdit && !errorMsg && (
                <p className="text-[13px] font-bold text-fg-muted">Peça a um dono ou administrador para cadastrar este produto.</p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
