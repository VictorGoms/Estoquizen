"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BarcodeScanner from "@/components/ui/BarcodeScanner";
import { supabase } from "@/lib/supabase";
import { getWorkspace } from "@/hooks/useWorkspace";
import { api } from "@/lib/api";
import { sanitizeText, sanitizeCode } from "@/lib/sanitize";

type Mode    = "adicionar" | "remover";
type Step    = "select" | "scanning" | "confirm" | "success" | "not_found";

interface FoundProduct { id: string; name: string; code: string; qty: number; unit: string }

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const MinusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const SearchXIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
  </svg>
);
const SpinnerIcon = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default function ScannerPage() {
  const router = useRouter();

  const [step, setStep]         = useState<Step>("select");
  const [mode, setMode]         = useState<Mode>("adicionar");
  const [product, setProduct]   = useState<FoundProduct | null>(null);
  const [scannedCode, setScannedCode] = useState("");
  const [qty, setQty]           = useState("1");
  const [reason, setReason]     = useState("");
  const [saving, setSaving]     = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function startScan(m: Mode) {
    setMode(m);
    setProduct(null);
    setScannedCode("");
    setQty("1");
    setReason("");
    setErrorMsg("");
    setStep("scanning");
  }

  async function handleDetect(code: string) {
    const trimmed = sanitizeCode(code);
    setScannedCode(trimmed);

    const ws = getWorkspace();
    if (!ws) { router.push("/select-workspace"); return; }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }

    const { data, error } = await supabase
      .from("products")
      .select("id, name, code, qty, unit")
      .eq("workspace_id", ws.id)
      .ilike("code", trimmed)
      .maybeSingle();

    if (error) {
      setErrorMsg(`Erro ao buscar produto: ${error.message}`);
      setStep("not_found");
      return;
    }

    if (data) {
      setProduct(data as FoundProduct);
      setStep("confirm");
    } else if (mode === "adicionar") {
      router.push(`/estoque/novo?code=${encodeURIComponent(trimmed)}`);
    } else {
      setStep("not_found");
    }
  }

  async function handleConfirm() {
    if (!product) return;
    const qtyNum = parseInt(qty, 10);
    if (!qtyNum || qtyNum <= 0) return;

    setSaving(true);
    setErrorMsg("");

    const delta = mode === "adicionar" ? qtyNum : -qtyNum;

    if (mode === "remover" && product.qty + delta < 0) {
      setErrorMsg(`Estoque insuficiente. Disponível: ${product.qty} ${product.unit}`);
      setSaving(false);
      return;
    }

    try {
      await api.post(`/products/${product.id}/adjust`, {
        delta,
        reason: sanitizeText(reason, 300) || (mode === "adicionar" ? "Entrada via scanner" : "Saída via scanner"),
      });
      setStep("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao registrar movimentação");
    } finally {
      setSaving(false);
    }
  }

  function handleScanAnother() {
    setStep("scanning");
    setProduct(null);
    setScannedCode("");
    setQty("1");
    setReason("");
    setErrorMsg("");
  }

  const isAdd = mode === "adicionar";

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">

      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <button
          type="button"
          onClick={() => {
            if (step === "select") router.push("/dashboard");
            else setStep("select");
          }}
          className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white transition-colors duration-200 cursor-pointer"
        >
          <ArrowLeftIcon />
        </button>
        <div>
          <h1 className="text-sm font-display font-semibold text-white">Escanear produto</h1>
          <p className="text-[11px] text-slate-600">
            {step === "select"    && "Escolha a operação"}
            {step === "scanning"  && (isAdd ? "Adicionar produto" : "Remover produto")}
            {step === "confirm"   && "Confirmar movimentação"}
            {step === "success"   && "Movimentação registrada"}
            {step === "not_found" && "Produto não encontrado"}
          </p>
        </div>
      </div>

      {/* ── SELECT MODE ── */}
      {step === "select" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5">
          <p className="text-slate-400 text-sm mb-2">Qual operação deseja realizar?</p>

          <button
            type="button"
            onClick={() => startScan("adicionar")}
            className="w-full max-w-sm rounded-2xl p-6 flex items-center gap-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: "rgba(5,150,105,0.12)",
              border: "1px solid rgba(16,185,129,0.25)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(5,150,105,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(5,150,105,0.12)"; }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(5,150,105,0.2)", border: "1px solid rgba(16,185,129,0.3)" }}
            >
              <span style={{ color: "#6EE7B7" }}><PlusIcon /></span>
            </div>
            <div className="text-left">
              <p className="text-white font-semibold text-base">Adicionar produto</p>
              <p className="text-slate-500 text-sm mt-0.5">Registrar entrada de estoque</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => startScan("remover")}
            className="w-full max-w-sm rounded-2xl p-6 flex items-center gap-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: "rgba(220,38,38,0.10)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.18)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.10)"; }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              <span style={{ color: "#FCA5A5" }}><MinusIcon /></span>
            </div>
            <div className="text-left">
              <p className="text-white font-semibold text-base">Remover produto</p>
              <p className="text-slate-500 text-sm mt-0.5">Registrar saída de estoque</p>
            </div>
          </button>
        </div>
      )}

      {/* ── SCANNER ── */}
      {step === "scanning" && (
        <BarcodeScanner
          title={isAdd ? "Escanear para adicionar" : "Escanear para remover"}
          subtitle="Aponte a câmera para o código de barras do produto"
          onDetect={handleDetect}
          onClose={() => setStep("select")}
        />
      )}

      {/* ── CONFIRM ── */}
      {step === "confirm" && product && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="w-full max-w-sm flex flex-col gap-4">

            {/* Product card */}
            <div
              className="rounded-2xl p-4"
              style={{ background: "rgba(22,32,52,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2">Produto identificado</p>
              <p className="text-white font-semibold text-base">{product.name}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="font-mono text-xs text-slate-600">{product.code}</span>
                <span className="text-xs text-slate-500">Estoque atual: <span className="text-slate-300 font-medium">{product.qty} {product.unit}</span></span>
              </div>
            </div>

            {/* Qty + reason */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] text-slate-500 uppercase tracking-wide font-medium block mb-1">
                  Quantidade a {isAdd ? "adicionar" : "remover"}
                </label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none text-center font-bold text-lg transition-all duration-200"
                  style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 uppercase tracking-wide font-medium block mb-1">Motivo (opcional)</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={isAdd ? "Ex: Compra fornecedor" : "Ex: Uso em produção"}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-700 outline-none transition-all duration-200"
                  style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 text-center">{errorMsg}</p>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!qty || saving}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: isAdd
                  ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                  : "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
                boxShadow: isAdd ? "0 4px 16px rgba(5,150,105,0.35)" : "0 4px 16px rgba(220,38,38,0.3)",
              }}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2"><SpinnerIcon /> Registrando…</span>
              ) : (
                isAdd ? `Confirmar entrada de ${qty || 0} ${product.unit}` : `Confirmar saída de ${qty || 0} ${product.unit}`
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep("scanning")}
              className="text-sm text-slate-500 hover:text-white cursor-pointer transition-colors duration-200 text-center"
            >
              Escanear outro código
            </button>
          </div>
        </div>
      )}

      {/* ── SUCCESS ── */}
      {step === "success" && product && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 text-center">
          <div style={{ color: isAdd ? "#6EE7B7" : "#FCA5A5" }}>
            <CheckCircleIcon />
          </div>
          <div>
            <p className="text-white font-semibold text-lg">
              {isAdd ? "Entrada registrada!" : "Saída registrada!"}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              {product.name} — {isAdd ? "+" : "-"}{qty} {product.unit}
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <button
              type="button"
              onClick={handleScanAnother}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: isAdd
                  ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                  : "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
              }}
            >
              Escanear outro produto
            </button>
            <button
              type="button"
              onClick={() => setStep("select")}
              className="w-full py-3 rounded-2xl text-sm font-medium text-slate-400 hover:text-white cursor-pointer transition-colors duration-200"
              style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Mudar operação
            </button>
            <button
              type="button"
              onClick={() => router.push(`/estoque/${product.id}`)}
              className="text-sm text-slate-600 hover:text-slate-400 cursor-pointer transition-colors duration-200"
            >
              Ver detalhes do produto
            </button>
          </div>
        </div>
      )}

      {/* ── NOT FOUND ── */}
      {step === "not_found" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 text-center">
          <div style={{ color: "#475569" }}>
            <SearchXIcon />
          </div>
          <div>
            <p className="text-white font-semibold text-base">Produto não encontrado</p>
            <p className="text-slate-500 text-sm mt-1">
              {errorMsg
                ? <span className="text-rose-400 text-xs">{errorMsg}</span>
                : <>Código <span className="font-mono text-slate-400">{scannedCode}</span> não está no workspace ativo.</>
              }
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <button
              type="button"
              onClick={handleScanAnother}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)" }}
            >
              Escanear novamente
            </button>
            <button
              type="button"
              onClick={() => setStep("select")}
              className="w-full py-3 rounded-2xl text-sm font-medium text-slate-400 hover:text-white cursor-pointer transition-colors duration-200"
              style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Voltar ao menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
