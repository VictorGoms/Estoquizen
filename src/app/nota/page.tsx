"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar  from "@/components/dashboard/DashboardTopBar";
import BottomNav        from "@/components/dashboard/BottomNav";
import AccessDenied     from "@/components/ui/AccessDenied";
import PageLoader       from "@/components/ui/PageLoader";
import BarcodeScanner   from "@/components/ui/BarcodeScanner";
import { useRole, can } from "@/hooks/useRole";
import { api }          from "@/lib/api";

/* ─── Icons ─── */
const FileXmlIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const ReceiptIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);
const QrCodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
  </svg>
);
const HashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
  </svg>
);
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const SpinnerIcon = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

type TipoNota = "xml" | "nfce" | "nfe";
type ModoNfce = "qrcode" | "chave";

/* ── Formata chave com espaços a cada 4 dígitos ── */
function formatarChave(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 44);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

const cardBase = "rounded-2xl p-5 flex flex-col gap-4";
const cardStyle = { background: "rgba(22,32,52,0.8)", border: "1px solid rgba(255,255,255,0.08)" };

export default function NotaPage() {
  const router  = useRouter();
  const role    = useRole();

  const [tipo,         setTipo]         = useState<TipoNota | null>(null);
  const [modo,         setModo]         = useState<ModoNfce>("chave");
  const [chave,        setChave]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [xmlInfo,      setXmlInfo]      = useState<{ nome: string; itens: number } | null>(null);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleQrDetect(raw: string) {
    setShowQrScanner(false);
    setError("");

    /* Extrai chave: parâmetro ?p= ou ?chave= ou primeiros 44 dígitos da string */
    let chaveExtraida = "";
    try {
      const url    = new URL(raw);
      const param  = url.searchParams.get("p") ?? url.searchParams.get("chave") ?? "";
      chaveExtraida = param.replace(/\D/g, "").slice(0, 44);
    } catch {
      /* Não é URL — tenta extrair 44 dígitos direto */
      chaveExtraida = raw.replace(/\D/g, "").slice(0, 44);
    }

    if (chaveExtraida.length !== 44) {
      setError("QR Code não reconhecido como NFC-e. Verifique se é um cupom fiscal válido.");
      return;
    }

    /* Preenche o campo e dispara a consulta automaticamente */
    setModo("chave");
    setChave(formatarChave(chaveExtraida));
    consultarChave(chaveExtraida);
  }

  async function consultarChave(chaveRaw: string) {
    setLoading(true);
    setError("");
    try {
      const result = await api.post<{ chave: string; total_itens: number; itens: unknown[] }>(
        "/nfe/consultar",
        { tipo: "nfce", chave: chaveRaw }
      );
      sessionStorage.setItem("nf_items", JSON.stringify(result.itens));
      sessionStorage.setItem("nf_chave", result.chave);
      sessionStorage.setItem("nf_tipo",  "nfce");
      router.push("/nota/revisao");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao consultar nota fiscal.");
    } finally {
      setLoading(false);
    }
  }

  if (role === null) return <PageLoader />;
  if (!can(role, "canAccessNota")) return <AccessDenied />;

  const chaveDigitos = chave.replace(/\s/g, "").length;
  const podeBuscar   = chaveDigitos === 44;

  function handleChaveChange(v: string) {
    setChave(formatarChave(v));
    setError("");
  }

  function getTag(el: Element, tag: string) {
    return el.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";
  }

  function handleXmlFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setXmlInfo(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const xml  = ev.target?.result as string;
        const doc  = new DOMParser().parseFromString(xml, "text/xml");

        if (doc.querySelector("parsererror")) {
          setError("Arquivo inválido. Certifique-se de que é um XML de NF-e.");
          return;
        }

        const dets  = Array.from(doc.getElementsByTagName("det"));
        if (dets.length === 0) {
          setError("Nenhum produto encontrado no XML. Verifique se é um arquivo de NF-e válido.");
          return;
        }

        const emit  = doc.getElementsByTagName("emit")[0];
        const emitNome = emit ? (getTag(emit, "xFant") || getTag(emit, "xNome")) : "";

        const itens = dets.map((det, i) => {
          const prod = det.getElementsByTagName("prod")[0];
          const ean  = getTag(prod, "cEAN");
          return {
            id:        `xml-${i}`,
            name:      getTag(prod, "xProd"),
            code:      ean && ean !== "SEM GTIN" ? ean : getTag(prod, "cProd"),
            unit:      getTag(prod, "uCom").toLowerCase() || "un",
            qty:       parseFloat(getTag(prod, "qCom"))   || 0,
            unitPrice: parseFloat(getTag(prod, "vUnCom")) || 0,
            status:    "novo" as const,
          };
        });

        sessionStorage.setItem("nf_items", JSON.stringify(itens));
        sessionStorage.setItem("nf_chave", getTag(doc.documentElement, "chNFe") || "");
        sessionStorage.setItem("nf_tipo",  "xml");

        setXmlInfo({ nome: emitNome, itens: itens.length });
      } catch {
        setError("Erro ao processar o arquivo XML.");
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleBuscarNfce(e: React.FormEvent) {
    e.preventDefault();
    if (!podeBuscar) return;
    consultarChave(chave.replace(/\s/g, ""));
  }

  return (
    <div className="min-h-screen bg-navy-900 relative overflow-hidden">
      <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ width: "800px", height: "450px", background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.11) 0%, transparent 70%)" }} />

      <DashboardSidebar />
      <DashboardTopBar />

      <main className="lg:pl-60 pt-14 pb-28 md:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 lg:py-8 flex flex-col gap-6">

            {/* Header */}
            <div>
              <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-1">Nova entrada</p>
              <h1 className="font-display font-bold text-xl sm:text-2xl text-white">Importar compra</h1>
              <p className="text-slate-400 text-sm mt-1.5">Selecione o formato para importar os produtos automaticamente.</p>
            </div>

            {/* ── Seletor de tipo ── */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "xml",  label: "XML",    icon: <FileXmlIcon />,   desc: "Arquivo .xml da NF-e",         soon: false },
                { id: "nfce", label: "NFC-e",  icon: <ReceiptIcon />,   desc: "Nota Fiscal do Consumidor",    soon: false },
                { id: "nfe",  label: "NF-e",   icon: <DocumentIcon />,  desc: "Nota Fiscal Eletrônica",       soon: true  },
              ].map((opt) => {
                const active = tipo === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={opt.soon}
                    onClick={() => { setTipo(opt.id as TipoNota); setError(""); setChave(""); }}
                    className="relative flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: active ? "rgba(37,99,235,0.15)" : "rgba(22,32,52,0.8)",
                      border:     active ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {opt.soon && (
                      <span className="absolute top-2 right-2 text-[9px] font-semibold text-slate-500 uppercase tracking-wide">Em breve</span>
                    )}
                    <span className={active ? "text-blue-400" : "text-slate-400"}>{opt.icon}</span>
                    <span className={`text-sm font-semibold ${active ? "text-white" : "text-slate-300"}`}>{opt.label}</span>
                    <span className="text-[11px] text-slate-500 leading-tight">{opt.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* ── Conteúdo por tipo ── */}
            {tipo === "nfce" && (
              <div className={cardBase} style={cardStyle}>
                <h3 className="text-sm font-semibold text-white">Como deseja consultar?</h3>

                {/* Sub-opções */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "qrcode", label: "QR Code",           icon: <QrCodeIcon />, soon: false },
                    { id: "chave",  label: "Número de consulta", icon: <HashIcon />,   soon: false },
                  ].map((opt) => {
                    const active = modo === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={opt.soon}
                        onClick={() => { setModo(opt.id as ModoNfce); setError(""); }}
                        className="relative flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: active ? "rgba(37,99,235,0.12)" : "rgba(15,23,42,0.5)",
                          border:     active ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.07)",
                        }}
                      >
                        {opt.soon && (
                          <span className="absolute top-1.5 right-2 text-[9px] font-semibold text-slate-500 uppercase tracking-wide">Em breve</span>
                        )}
                        <span className={active ? "text-blue-400" : "text-slate-500"}>{opt.icon}</span>
                        <span className={`text-sm font-medium ${active ? "text-white" : "text-slate-400"}`}>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* ── QR Code ── */}
                {modo === "qrcode" && (
                  <div className="flex flex-col items-center gap-4 pt-1">
                    {error && (
                      <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 w-full">
                        {error}
                      </p>
                    )}
                    {loading ? (
                      <div className="flex flex-col items-center gap-3 py-6">
                        <SpinnerIcon />
                        <p className="text-sm text-slate-400">Consultando nota fiscal…</p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setError(""); setShowQrScanner(true); }}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                        style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}
                      >
                        <QrCodeIcon /> Escanear QR Code do cupom
                      </button>
                    )}
                    <p className="text-[11px] text-slate-600 text-center">
                      Aponte a câmera para o QR Code impresso no cupom fiscal (NFC-e de SP).
                    </p>
                  </div>
                )}

                {/* ── Formulário: número de consulta ── */}
                {modo === "chave" && (
                  <form onSubmit={handleBuscarNfce} className="flex flex-col gap-4 pt-1">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">
                        Chave de acesso (44 dígitos)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={chave}
                        onChange={(e) => handleChaveChange(e.target.value)}
                        placeholder="3526 0306 0572 2302 3970 6504 0000 0116 6014 0012 8035"
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-slate-700 outline-none transition-all duration-200 font-mono"
                        style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                        onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                      />
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[11px] text-slate-600">
                          Impressa no cupom fiscal abaixo do código de barras.
                        </p>
                        <p className={`text-[11px] tabular-nums ${chaveDigitos === 44 ? "text-green-400" : "text-slate-600"}`}>
                          {chaveDigitos}/44
                        </p>
                      </div>
                    </div>

                    {error && (
                      <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={!podeBuscar || loading}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}
                    >
                      {loading ? <><SpinnerIcon /> Consultando…</> : <><SearchIcon /> Buscar nota</>}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ── XML ── */}
            {tipo === "xml" && (
              <div className={cardBase} style={cardStyle}>
                <h3 className="text-sm font-semibold text-white">Selecione o arquivo XML da NF-e</h3>
                <p className="text-xs text-slate-500 -mt-2">
                  O fornecedor envia o XML por e-mail junto com o DANFE (PDF da nota).
                </p>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".xml,text/xml,application/xml"
                  className="hidden"
                  onChange={handleXmlFile}
                />

                <button
                  type="button"
                  onClick={() => { fileRef.current?.click(); setXmlInfo(null); setError(""); }}
                  className="flex flex-col items-center justify-center gap-3 w-full rounded-xl py-10 transition-all duration-200 cursor-pointer"
                  style={{ border: "2px dashed rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.4)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                >
                  <FileXmlIcon />
                  <span className="text-sm text-slate-400">Clique para selecionar o arquivo <span className="text-white font-medium">.xml</span></span>
                </button>

                {error && (
                  <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
                )}

                {xmlInfo && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                      style={{ background: "rgba(5,150,105,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-emerald-300">
                          {xmlInfo.itens} {xmlInfo.itens === 1 ? "produto encontrado" : "produtos encontrados"}
                        </p>
                        {xmlInfo.nome && <p className="text-xs text-slate-500 mt-0.5">{xmlInfo.nome}</p>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push("/nota/revisao")}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                      style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}
                    >
                      Revisar produtos
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Placeholder NF-e (em breve) */}
            {tipo === "nfe" && (
              <div className={`${cardBase} items-center py-10`} style={cardStyle}>
                <p className="text-slate-400 text-sm text-center">Esta funcionalidade estará disponível em breve.</p>
              </div>
            )}

          </div>
        </div>
      </main>

      <BottomNav />

      {showQrScanner && (
        <BarcodeScanner
          title="Escanear QR Code"
          subtitle="Aponte para o QR Code do cupom fiscal (NFC-e)"
          hint="Mantenha o cupom a ~20 cm da câmera, bem iluminado e sem reflexo. Se demorar, use 'Número de consulta'."
          preferQr
          onDetect={handleQrDetect}
          onClose={() => setShowQrScanner(false)}
        />
      )}
    </div>
  );
}
