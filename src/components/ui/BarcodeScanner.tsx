"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, BrowserQRCodeReader } from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";

type ScanState = "requesting" | "scanning" | "unsupported" | "error" | "no_mediadevices";

const KeyboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface BarcodeScannerProps {
  title?: string;
  subtitle?: string;
  hint?: string;        // dica extra exibida abaixo do scanner
  preferQr?: boolean;  // tenta maior resolução para QR codes
  onDetect: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({
  title = "Escanear código",
  subtitle = "Aponte a câmera para o código de barras",
  hint,
  preferQr = false,
  onDetect,
  onClose,
}: BarcodeScannerProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef    = useRef<number>(0);
  const zxingRef  = useRef<{ stop: () => void } | null>(null);

  const activeRef = useRef(false); // false enquanto desmontado

  const [scanState, setScanState]   = useState<ScanState>("requesting");
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState("");

  function playBeep() {
    try {
      const ctx = new AudioContext();
      const dur = 0.18;
      const now = ctx.currentTime;

      /* Tom principal + harmônico leve para encorpar, sem variação de frequência */
      [[940, 0.5], [1880, 0.1]].forEach(([freq, vol]) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.start(now);
        osc.stop(now + dur);
      });
    } catch { /* silencia erros de AudioContext */ }
  }

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    zxingRef.current?.stop();
    zxingRef.current = null;

    /* Para todos os tracks — tanto os do stream manual quanto os do zxing */
    const killStream = (s: MediaStream | null) => {
      s?.getTracks().forEach((t) => { t.enabled = false; t.stop(); });
    };

    killStream(streamRef.current);
    streamRef.current = null;

    if (videoRef.current) {
      /* Mata o stream que o zxing possa ter criado internamente */
      killStream(videoRef.current.srcObject as MediaStream | null);
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!activeRef.current) return;
    setScanState("requesting");
    setManualMode(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanState("no_mediadevices");
      return;
    }

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      }).catch(() => navigator.mediaDevices.getUserMedia({ video: true }));
    } catch (err) {
      if (!activeRef.current) return;
      const name = (err as DOMException)?.name ?? "";
      setScanState(name === "NotAllowedError" || name === "PermissionDeniedError" ? "error" : "error");
      return;
    }

    if (!activeRef.current) { stream?.getTracks().forEach((t) => t.stop()); return; }
    streamRef.current = stream;

    /* ── Caminho 1: BarcodeDetector nativo (Android/macOS Chrome) ── */
    if ("BarcodeDetector" in window) {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch { /* AbortError ignorado */ }
      }
      if (!activeRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({
        formats: ["ean_13", "ean_8", "code_128", "code_39", "qr_code", "upc_a", "upc_e", "itf"],
      });
      setScanState("scanning");

      const tick = async () => {
        if (!activeRef.current) return;
        if (!videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0 && activeRef.current) {
            playBeep();
            stopCamera();
            onDetect(barcodes[0].rawValue as string);
            return;
          }
        } catch { /* non-fatal */ }
        if (activeRef.current) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    /* ── Caminho 2: zxing-js — deixa o zxing controlar o vídeo ── */
    try {
      if (!activeRef.current) return;

      const qrHints = new Map([[DecodeHintType.TRY_HARDER, false]]);
      const reader = preferQr
        ? new BrowserQRCodeReader(qrHints)
        : new BrowserMultiFormatReader();
      setScanState("scanning");

      let detected = false;
      const controls = await reader.decodeFromStream(stream, videoRef.current!, (result) => {
        if (!result || detected || !activeRef.current) return;
        detected = true;
        playBeep();
        controls.stop();
        stream!.getTracks().forEach((t) => t.stop());
        if (videoRef.current) { videoRef.current.pause(); videoRef.current.srcObject = null; }
        streamRef.current = null;
        onDetect(result.getText());
      });

      if (!activeRef.current) { controls.stop(); return; }
      zxingRef.current = { stop: () => controls.stop() };
    } catch {
      if (activeRef.current) setScanState("unsupported");
    }
  }, [stopCamera, onDetect]);

  useEffect(() => {
    activeRef.current = true;
    startCamera();
    return () => {
      activeRef.current = false;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  function handleClose() {
    stopCamera();
    onClose();
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    stopCamera();
    onDetect(code);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-navy-900"
      style={{ background: "rgba(10,15,28,0.98)" }}
    >
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <button
          type="button"
          onClick={handleClose}
          className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white transition-colors duration-200 cursor-pointer"
        >
          <XIcon />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-display font-semibold text-white">{title}</h2>
          <p className="text-[11px] text-slate-600">{subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-6">

        {!manualMode && (
          <div className="w-full max-w-sm flex flex-col items-center gap-5">
            <div
              className="relative w-full aspect-square rounded-3xl overflow-hidden bg-black"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

              {scanState === "scanning" && (
                <>
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: "radial-gradient(ellipse 60% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)"
                  }} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-52 h-52 relative">
                      {[
                        "top-0 left-0 border-t-2 border-l-2 rounded-tl-xl",
                        "top-0 right-0 border-t-2 border-r-2 rounded-tr-xl",
                        "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl",
                        "bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl",
                      ].map((cls, i) => (
                        <div key={i} className={`absolute w-8 h-8 border-blue-400 ${cls}`} />
                      ))}
                      <div
                        className="absolute left-2 right-2 h-0.5 rounded-full opacity-80"
                        style={{
                          background: "linear-gradient(90deg, transparent, #60A5FA, transparent)",
                          animation: "scanLine 2s ease-in-out infinite",
                          top: "50%",
                        }}
                      />
                    </div>
                  </div>
                  <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-white/70">Escaneando…</p>
                </>
              )}

              {scanState === "requesting" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
                  <svg className="animate-spin w-8 h-8 text-brand-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-white/70 text-sm">Acessando câmera…</p>
                </div>
              )}

              {scanState === "unsupported" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center">
                  <p className="text-white font-medium text-sm">Scanner não suportado</p>
                  <p className="text-slate-400 text-xs">Use a entrada manual abaixo.</p>
                </div>
              )}

              {scanState === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center">
                  <p className="text-white font-medium text-sm">Permissão negada</p>
                  <p className="text-slate-400 text-xs">Permita o acesso à câmera nas configurações do browser e tente novamente.</p>
                  <button type="button" onClick={startCamera} className="mt-1 text-xs text-blue-400 hover:text-blue-300 cursor-pointer">Tentar novamente</button>
                </div>
              )}

              {scanState === "no_mediadevices" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center">
                  <p className="text-white font-medium text-sm">Câmera não disponível</p>
                  <p className="text-slate-400 text-xs">A câmera requer HTTPS. Use a entrada manual abaixo.</p>
                </div>
              )}
            </div>

            {hint && scanState === "scanning" && (
              <p className="text-[11px] text-slate-600 text-center max-w-xs">{hint}</p>
            )}

            {scanState === "no_mediadevices" ? (
              <button
                type="button"
                onClick={() => setManualMode(true)}
                className="flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors duration-200"
                style={{ color: "#60A5FA" }}
              >
                <KeyboardIcon />
                Usar entrada manual
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setManualMode(true)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-white cursor-pointer transition-colors duration-200"
              >
                <KeyboardIcon />
                Digitar código manualmente
              </button>
            )}
          </div>
        )}

        {manualMode && (
          <div className="w-full max-w-sm flex flex-col gap-5">
            <div className="text-center">
              <p className="text-white font-semibold text-base">Entrada manual</p>
              <p className="text-slate-500 text-sm mt-1">Digite o código de barras</p>
            </div>
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Digite o código de barras"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl text-center font-mono text-base text-white placeholder-slate-600 outline-none tracking-widest transition-all duration-200"
                style={{
                  background: "rgba(30,41,59,0.7)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                autoFocus
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)" }}
              >
                Confirmar código
              </button>
            </form>
            <button
              type="button"
              onClick={() => { setManualCode(""); startCamera(); }}
              className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-white cursor-pointer transition-colors duration-200"
            >
              <ArrowLeftIcon />
              Voltar para câmera
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 20%; opacity: 0.4; }
          50% { top: 80%; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
