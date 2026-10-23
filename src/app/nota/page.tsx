"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar  from "@/components/dashboard/DashboardTopBar";
import BottomNav        from "@/components/dashboard/BottomNav";
import AccessDenied     from "@/components/ui/AccessDenied";
import PageLoader       from "@/components/ui/PageLoader";
import BarcodeScanner   from "@/components/ui/BarcodeScanner";
import FormField, { inputClass } from "@/components/ui/FormField";
import { ArrowRightIcon, CheckIcon, DocumentIcon, ScanIcon, SearchIcon, Spinner } from "@/components/ui/icons";
import { useRole, can } from "@/hooks/useRole";
import { usePlan, planInfo, inicioDoMesBrasil } from "@/hooks/usePlan";
import { supabase }     from "@/lib/supabase";
import PlanUpsell       from "@/components/ui/PlanUpsell";
import { getWorkspace } from "@/hooks/useWorkspace";
import { api }          from "@/lib/api";
import { chaveValida, codigoDoItem, gtinValido } from "@/lib/nfe";

/* ─── Ícones desta tela ─── */
const FileCodeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="m10 13-2 2 2 2" /><path d="m14 13 2 2-2 2" />
  </svg>
);
const ReceiptIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6M9 16h3" />
  </svg>
);
const QrIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    <rect x="3.5" y="3.5" width="6" height="6" rx="1.5" /><rect x="14.5" y="3.5" width="6" height="6" rx="1.5" /><rect x="3.5" y="14.5" width="6" height="6" rx="1.5" />
    <path d="M14.5 14.5h2.5v2.5M20.5 14.5v.01M14.5 20.5h.01M17.5 20.5h3v-3" />
  </svg>
);

type TipoNota = "xml" | "nfce" | "nfe";
type ModoNfce = "qrcode" | "chave";

const TIPOS: Array<{ id: TipoNota; label: string; desc: string; Icon: typeof ReceiptIcon; soon: boolean }> = [
  { id: "xml",  label: "XML da NF-e", desc: "Arquivo que o fornecedor envia por e-mail", Icon: FileCodeIcon, soon: false },
  { id: "nfce", label: "NFC-e",       desc: "Cupom fiscal: QR Code ou chave de acesso",  Icon: ReceiptIcon,  soon: false },
  { id: "nfe",  label: "NF-e",        desc: "Consulta pela chave da nota eletrônica",    Icon: DocumentIcon, soon: true  },
];

/* ── Formata chave com espaços a cada 4 dígitos ── */
function formatarChave(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 44);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="px-4 py-3 rounded-3xl bg-zero/10 text-zero text-sm font-bold leading-relaxed">
      {children}
    </p>
  );
}

export default function NotaPage() {
  const router  = useRouter();
  const role    = useRole();
  const { plan, loading: planLoading } = usePlan();

  const [wsName,       setWsName]       = useState("");
  const [tipo,         setTipo]         = useState<TipoNota | null>(null);
  const [modo,         setModo]         = useState<ModoNfce>("chave");
  const [chave,        setChave]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [xmlInfo,      setXmlInfo]      = useState<{ nome: string; itens: number; arquivo: string } | null>(null);
  const [dragOver,     setDragOver]     = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  /* EQZ-34: a SEFAZ não deixou ler a NFC-e. Guarda a chave tentada e se veio do QR, para oferecer as saídas */
  const [falha, setFalha] = useState<{ chave: string; viaQr: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ws = getWorkspace();
    if (ws) setWsName(ws.name);
  }, []);

  /* Basic lê até 2 notas por mês (EQZ-27): conta as do mês para avisar antes de tentar */
  const cota = planInfo(plan)?.notasPorMes ?? null;
  const [notasUsadas, setNotasUsadas] = useState<number | null>(null);
  useEffect(() => {
    const ws = getWorkspace();
    if (!ws || cota === null) return;
    supabase
      .from("nota_imports")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ws.id)
      .gte("created_at", inicioDoMesBrasil())
      .then(({ count }) => setNotasUsadas(count ?? 0));
  }, [cota]);

  function handleQrDetect(raw: string) {
    setShowQrScanner(false);
    setError("");

    /* Extrai chave: parâmetro ?p= ou ?chave= ou primeiros 44 dígitos da string. O link inteiro também vai
       para a API: ele traz a assinatura que abre a nota sem captcha em estados como a BA (2026-10-23) */
    let chaveExtraida = "";
    let linkDoQr: string | undefined;
    try {
      const url    = new URL(raw);
      const param  = url.searchParams.get("p") ?? url.searchParams.get("chave") ?? url.searchParams.get("chNFe") ?? "";
      chaveExtraida = param.replace(/\D/g, "").slice(0, 44);
      if (url.protocol === "http:" || url.protocol === "https:") linkDoQr = raw.trim();
    } catch {
      /* Não é URL — tenta extrair 44 dígitos direto */
      chaveExtraida = raw.replace(/\D/g, "").slice(0, 44);
    }

    if (chaveExtraida.length !== 44 || !chaveValida(chaveExtraida)) {
      setError("Esse QR Code não parece ser de uma NFC-e. Confira se é o QR Code do cupom fiscal.");
      return;
    }

    /* Preenche o campo e dispara a consulta automaticamente */
    setModo("chave");
    setChave(formatarChave(chaveExtraida));
    consultarChave(chaveExtraida, linkDoQr);
  }

  async function consultarChave(chaveRaw: string, linkDoQr?: string) {
    setLoading(true);
    setError("");
    setFalha(null);
    try {
      const result = await api.post<{ chave: string; total_itens: number; itens: unknown[] }>(
        "/nfe/consultar",
        { tipo: "nfce", chave: chaveRaw, workspace_id: getWorkspace()?.id, ...(linkDoQr ? { qr_url: linkDoQr } : {}) }
      );
      sessionStorage.setItem("nf_items", JSON.stringify(result.itens));
      sessionStorage.setItem("nf_chave", result.chave);
      sessionStorage.setItem("nf_tipo",  "nfce");
      router.push("/nota/revisao");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao consultar nota fiscal.");
      setFalha({ chave: chaveRaw, viaQr: !!linkDoQr });
    } finally {
      setLoading(false);
    }
  }

  /* EQZ-34: dá entrada digitando os itens na tela de revisão. A chave (se válida) vai junto e impede
     importar a mesma nota duas vezes */
  function digitarItens(chaveDaNota: string) {
    try {
      sessionStorage.setItem("nf_items", "[]");
      sessionStorage.setItem("nf_chave", chaveValida(chaveDaNota) ? chaveDaNota : "");
      sessionStorage.setItem("nf_tipo",  "manual");
    } catch { /* sem sessionStorage */ }
    router.push("/nota/revisao");
  }

  if (role === null) return <PageLoader />;
  if (!can(role, "canAccessNota")) return <AccessDenied />;
  if (planLoading) return <PageLoader />;
  /* A API e o banco conferem de novo; aqui é só para não deixar a pessoa preencher à toa */
  if (cota !== null && notasUsadas !== null && notasUsadas >= cota) {
    return (
      <PlanUpsell
        title="As notas deste mês já foram lidas"
        desc={`O plano ${planInfo(plan)?.label} lê até ${cota} notas de compra por mês. No Growth e no Pro não há limite. A contagem recomeça no dia 1º.`}
      />
    );
  }

  const chaveDigitos = chave.replace(/\s/g, "").length;
  /* O 44º dígito confere os outros: chave digitada errada nem vai à SEFAZ */
  const chaveErrada  = chaveDigitos === 44 && !chaveValida(chave.replace(/\s/g, ""));
  const podeBuscar   = chaveDigitos === 44 && !chaveErrada;

  function handleChaveChange(v: string) {
    setChave(formatarChave(v));
    setError("");
    setFalha(null);
  }

  /* As saídas quando a SEFAZ não deixa ler: QR (resolve o captcha da chave digitada), digitar ou XML */
  const planoB = falha && !loading && (
    <div className="bg-ink rounded-4xl p-4 flex flex-col gap-3">
      <p className="text-[15px] font-black">Outras formas de dar entrada nesta nota</p>
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
        {!falha.viaQr && (
          <button
            type="button"
            onClick={() => { setModo("qrcode"); setError(""); setFalha(null); setShowQrScanner(true); }}
            className="min-h-[48px] px-5 rounded-full bg-accent text-ink text-sm font-black cursor-pointer hover:brightness-110 transition-[filter] flex items-center justify-center gap-2"
          >
            <QrIcon className="w-[18px] h-[18px]" /> Ler o QR Code do cupom
          </button>
        )}
        <button
          type="button"
          onClick={() => digitarItens(falha.chave)}
          className="min-h-[48px] px-5 rounded-full bg-surface-2 text-sm font-black cursor-pointer hover:bg-white/10 transition-colors"
        >
          Digitar os itens
        </button>
        <button
          type="button"
          onClick={() => { setTipo("xml"); setError(""); setFalha(null); }}
          className="min-h-[48px] px-5 rounded-full bg-surface-2 text-sm font-black cursor-pointer hover:bg-white/10 transition-colors"
        >
          Tenho o XML da nota
        </button>
      </div>
      <p className="text-[13px] font-bold text-fg-subtle leading-relaxed">
        {!falha.viaQr && "Em vários estados, o QR Code abre a nota quando a chave digitada não abre. "}
        Quando a leitura falha, a nossa equipe é avisada para liberar as notas deste estado.
      </p>
    </div>
  );

  function getTag(el: Element, tag: string) {
    return el.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";
  }

  function readXmlFile(file: File) {
    setError("");
    setXmlInfo(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const xml  = ev.target?.result as string;
        const doc  = new DOMParser().parseFromString(xml, "text/xml");

        if (doc.querySelector("parsererror")) {
          setError("Arquivo inválido. Confira se é o XML da NF-e (não o PDF/DANFE).");
          return;
        }

        const dets  = Array.from(doc.getElementsByTagName("det"));
        if (dets.length === 0) {
          setError("Nenhum produto encontrado no XML. Confira se é o arquivo de uma NF-e.");
          return;
        }

        const emit  = doc.getElementsByTagName("emit")[0];
        const emitNome = emit ? (getTag(emit, "xFant") || getTag(emit, "xNome")) : "";
        /* Raiz do CNPJ do emitente: o código interno do fornecedor ganha ela na frente */
        const cnpjRaiz = ((emit ? getTag(emit, "CNPJ") : "") || getTag(doc.documentElement, "chNFe").slice(6, 20)).slice(0, 8);

        const itens = dets.map((det, i) => {
          const prod = det.getElementsByTagName("prod")[0];
          const ean  = getTag(prod, "cEAN");
          return {
            id:        `xml-${i}`,
            name:      getTag(prod, "xProd"),
            code:      gtinValido(ean) ? ean : codigoDoItem(getTag(prod, "cProd"), cnpjRaiz),
            unit:      getTag(prod, "uCom").toLowerCase() || "un",
            qty:       parseFloat(getTag(prod, "qCom"))   || 0,
            unitPrice: parseFloat(getTag(prod, "vUnCom")) || 0,
            status:    "novo" as const,
          };
        });

        sessionStorage.setItem("nf_items", JSON.stringify(itens));
        sessionStorage.setItem("nf_chave", getTag(doc.documentElement, "chNFe") || "");
        sessionStorage.setItem("nf_tipo",  "xml");

        setXmlInfo({ nome: emitNome, itens: itens.length, arquivo: file.name });
      } catch {
        setError("Erro ao processar o arquivo XML.");
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  function handleXmlInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readXmlFile(file);
    /* Limpa para permitir escolher o mesmo arquivo de novo */
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readXmlFile(file);
  }

  async function handleBuscarNfce(e: React.FormEvent) {
    e.preventDefault();
    if (!podeBuscar) return;
    consultarChave(chave.replace(/\s/g, ""));
  }

  return (
    <div className="min-h-screen bg-ink">
      <DashboardSidebar workspaceName={wsName} />
      <DashboardTopBar  workspaceName={wsName} />

      <main className="lg:pl-64 pt-14 pb-28 lg:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5">

          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight leading-tight">Ler nota de compra</h1>
            <p className="text-sm lg:text-[15px] font-bold text-fg-muted">Os produtos da nota entram no estoque de uma vez, depois de você revisar.</p>
            {cota !== null && notasUsadas !== null && (
              <p className="text-[13px] font-bold text-fg-subtle">
                Plano {planInfo(plan)?.label}: {notasUsadas} de {cota} notas usadas este mês.
              </p>
            )}
          </div>

          {/* ── Formato da nota ── */}
          <fieldset className="flex flex-col gap-3">
            <legend className="text-lg font-black mb-3">Qual nota você tem?</legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {TIPOS.map((opt) => {
                const active = tipo === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={opt.soon}
                    aria-pressed={active}
                    onClick={() => { setTipo(opt.id); setError(""); setChave(""); setXmlInfo(null); setFalha(null); }}
                    className={`relative flex sm:flex-col items-center sm:items-start gap-3.5 sm:gap-3 p-4 rounded-4xl text-left cursor-pointer transition-colors disabled:cursor-not-allowed ${
                      active ? "bg-inverse text-ink" : "bg-surface text-fg hover:bg-[#19243a] disabled:hover:bg-surface"
                    } ${opt.soon ? "opacity-55" : ""}`}
                  >
                    <span className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${active ? "bg-ink text-accent" : "bg-surface-2 text-fg-soft"}`}>
                      <opt.Icon className="w-6 h-6" />
                    </span>
                    <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <span className="text-[15px] font-black">{opt.label}</span>
                      <span className={`text-[13px] font-bold leading-snug ${active ? "text-inverse-muted" : "text-fg-muted"}`}>{opt.desc}</span>
                    </span>
                    {opt.soon && (
                      <span className="sm:absolute sm:top-4 sm:right-4 shrink-0 px-2.5 py-1 rounded-full bg-surface-2 text-[11px] font-black text-fg-muted">
                        Em breve
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {tipo === null && (
            <p className="py-10 px-6 text-center text-sm font-bold text-fg-subtle border-2 border-dashed border-white/8 rounded-5xl">
              Escolha o tipo de nota para começar.
            </p>
          )}

          {/* ── NFC-e ── */}
          {tipo === "nfce" && (
            <section aria-labelledby="nota-nfce" className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="nota-nfce" className="text-lg font-black">Como você quer consultar?</h2>
                <div role="group" aria-label="Forma de consulta" className="flex gap-1 p-1 rounded-full bg-ink">
                  {([
                    { id: "qrcode", label: "QR Code" },
                    { id: "chave",  label: "Chave de acesso" },
                  ] as const).map((opt) => {
                    const active = modo === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => { setModo(opt.id); setError(""); }}
                        className={`min-h-[40px] px-4 rounded-full text-[13px] cursor-pointer transition-colors duration-200 ${
                          active ? "bg-inverse text-ink font-black" : "text-fg-muted font-extrabold hover:text-fg"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {modo === "qrcode" && (
                <div className="flex flex-col gap-4">
                  {error && <ErrorBox>{error}</ErrorBox>}
                  {planoB}
                  {loading ? (
                    <div role="status" className="flex flex-col items-center gap-3 py-8 text-fg-muted">
                      <Spinner className="w-7 h-7" />
                      <p className="text-sm font-bold">Consultando a nota na Sefaz…</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setError(""); setShowQrScanner(true); }}
                      className="min-h-[56px] flex items-center justify-center gap-2.5 rounded-full bg-accent text-ink text-base font-black cursor-pointer hover:brightness-110 transition-[filter]"
                    >
                      <QrIcon className="w-[22px] h-[22px]" /> Escanear QR Code do cupom
                    </button>
                  )}
                  <p className="text-[13px] font-bold text-fg-subtle text-center leading-relaxed">
                    Aponte a câmera para o QR Code impresso no fim do cupom.
                  </p>
                </div>
              )}

              {modo === "chave" && (
                <form onSubmit={handleBuscarNfce} className="flex flex-col gap-4">
                  <FormField
                    label="Chave de acesso (44 dígitos)"
                    htmlFor="nota-chave"
                    hint={
                      <span className="flex items-center justify-between gap-3 text-[13px] font-bold text-fg-subtle">
                        <span id="nota-chave-hint">Fica no cupom, logo abaixo do código de barras.</span>
                        <span className={`tabular-nums font-black ${podeBuscar ? "text-ok" : ""}`}>{chaveDigitos}/44</span>
                      </span>
                    }
                  >
                    {/* textarea: os 44 dígitos não cabem numa linha no celular */}
                    <textarea
                      id="nota-chave"
                      rows={2}
                      inputMode="numeric"
                      autoComplete="off"
                      spellCheck={false}
                      aria-describedby="nota-chave-hint"
                      value={chave}
                      onChange={(e) => handleChaveChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); e.currentTarget.form?.requestSubmit(); }
                      }}
                      placeholder="3526 0306 0572 2302 3970 6504 0000 0116 6014 0012 8035"
                      className={`${inputClass} h-auto py-3 resize-none tabular-nums tracking-wide leading-relaxed`}
                    />
                  </FormField>

                  {chaveErrada && !error && (
                    <ErrorBox>Chave inválida: confira os números. O último dígito não bate com os anteriores.</ErrorBox>
                  )}
                  {error && <ErrorBox>{error}</ErrorBox>}
                  {planoB}

                  <button
                    type="submit"
                    disabled={!podeBuscar || loading}
                    className="min-h-[54px] flex items-center justify-center gap-2 rounded-full bg-accent text-ink text-base font-black cursor-pointer hover:brightness-110 transition-[filter] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Spinner /> : <SearchIcon strokeWidth={2.4} />}
                    {loading ? "Consultando…" : "Buscar nota"}
                  </button>
                </form>
              )}

              {!falha && (
                <button
                  type="button"
                  onClick={() => digitarItens(chave.replace(/\s/g, ""))}
                  className="self-center min-h-[40px] px-3 text-[13px] font-extrabold text-fg-muted underline underline-offset-2 cursor-pointer hover:text-fg"
                >
                  Cupom apagado ou sem QR? Digite os itens à mão
                </button>
              )}
            </section>
          )}

          {/* ── XML ── */}
          {tipo === "xml" && (
            <section aria-labelledby="nota-xml" className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 id="nota-xml" className="text-lg font-black">Arquivo XML da NF-e</h2>
                <p className="text-sm font-bold text-fg-muted">O fornecedor manda o XML por e-mail junto com o DANFE (o PDF da nota).</p>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".xml,text/xml,application/xml"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={handleXmlInput}
              />

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center gap-3 w-full rounded-4xl py-10 px-6 border-2 border-dashed cursor-pointer transition-colors ${
                  dragOver ? "border-accent bg-accent/10" : "border-white/[0.14] bg-ink/60 hover:border-accent/60"
                }`}
              >
                <span className="w-14 h-14 rounded-full bg-surface-2 text-accent flex items-center justify-center">
                  <FileCodeIcon className="w-7 h-7" />
                </span>
                <span className="text-[15px] font-black">Escolher arquivo .xml</span>
                <span className="hidden sm:block text-[13px] font-bold text-fg-subtle">ou arraste o arquivo para cá</span>
              </button>

              {error && <ErrorBox>{error}</ErrorBox>}

              {xmlInfo && (
                <div className="flex flex-col gap-3">
                  <div role="status" className="flex items-center gap-3.5 p-4 rounded-4xl bg-ok/10">
                    <span className="w-10 h-10 rounded-full bg-ok text-ink flex items-center justify-center shrink-0">
                      <CheckIcon className="w-5 h-5" strokeWidth={3} />
                    </span>
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <p className="text-[15px] font-black text-ok">
                        {xmlInfo.itens} {xmlInfo.itens === 1 ? "produto encontrado" : "produtos encontrados"}
                      </p>
                      <p className="text-[13px] font-bold text-fg-muted truncate">
                        {xmlInfo.nome ? `${xmlInfo.nome} · ` : ""}{xmlInfo.arquivo}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/nota/revisao")}
                    className="min-h-[54px] flex items-center justify-center gap-2 rounded-full bg-accent text-ink text-base font-black cursor-pointer hover:brightness-110 transition-[filter]"
                  >
                    Revisar produtos <ArrowRightIcon strokeWidth={2.4} />
                  </button>
                </div>
              )}
            </section>
          )}

          <p className="flex items-start gap-2.5 px-1 text-[13px] font-bold text-fg-subtle leading-relaxed">
            <ScanIcon className="w-4 h-4 mt-0.5 shrink-0" />
            Para dar entrada ou saída de um produto só, use o botão Escanear no menu.
          </p>
        </div>
      </main>

      <BottomNav />

      {showQrScanner && (
        <BarcodeScanner
          title="Escanear QR Code"
          subtitle="Aponte para o QR Code do cupom fiscal (NFC-e)"
          hint="Mantenha o cupom a ~20 cm da câmera, bem iluminado e sem reflexo. Se demorar, use a chave de acesso."
          preferQr
          onDetect={handleQrDetect}
          onClose={() => setShowQrScanner(false)}
        />
      )}
    </div>
  );
}
