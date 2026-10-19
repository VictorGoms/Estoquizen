"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, BrowserQRCodeReader } from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";
import { ArrowLeftIcon, XIcon, Spinner } from "@/components/ui/icons";

type ScanState = "requesting" | "scanning" | "unsupported" | "error" | "no_mediadevices" | "timeout";

/* Sem câmera (ou com ela presa em outro app) o getUserMedia pode nunca responder */
const CAMERA_TIMEOUT_MS = 10_000;

const CAM_ERROR = {
  denied:   { title: "Permissão negada",          desc: "Permita o acesso à câmera nas configurações do navegador e tente novamente." },
  notfound: { title: "Nenhuma câmera encontrada", desc: "Este aparelho não tem câmera disponível. Digite o código abaixo." },
  busy:     { title: "Câmera em uso",             desc: "Outro app está usando a câmera. Feche-o e tente novamente, ou digite o código." },
} as const;

const KeyboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

interface BarcodeScannerProps {
  title?: string;
  subtitle?: string;
  hint?: string;        // dica extra exibida abaixo do scanner
  preferQr?: boolean;  // tenta maior resolução para QR codes
  /** "overlay": tela cheia com barra própria (padrão). "embedded": só a câmera, dentro da página. */
  variant?: "overlay" | "embedded";
  onDetect: (code: string) => void;
  onClose?: () => void;
}

export default function BarcodeScanner({
  title = "Escanear código",
  subtitle = "Aponte a câmera para o código de barras",
  hint,
  preferQr = false,
  variant = "overlay",
  onDetect,
  onClose,
}: BarcodeScannerProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef    = useRef<number>(0);
  const zxingRef  = useRef<{ stop: () => void } | null>(null);

  const activeRef = useRef(false); // false enquanto desmontado
  const attemptRef = useRef(0);    // cada startCamera é uma tentativa; respostas de tentativas antigas são descartadas
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [scanState, setScanState]   = useState<ScanState>("requesting");
  /* Antes toda falha virava "Permissão negada", mesmo sem câmera ou com ela em uso */
  const [camError, setCamError]     = useState<"denied" | "notfound" | "busy">("denied");
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
    stopCamera();
    const attempt = ++attemptRef.current;
    const stale = () => !activeRef.current || attempt !== attemptRef.current;
    setScanState("requesting");
    setManualMode(false);

    /* Passou do tempo e ainda pedindo: oferece tentar de novo ou digitar. Se a câmera responder
       depois (ex.: a pessoa demorou no aviso de permissão), segue normalmente. */
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (!stale()) setScanState((s) => (s === "requesting" ? "timeout" : s));
    }, CAMERA_TIMEOUT_MS);

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
      if (stale()) return;
      const name = (err as DOMException)?.name;
      setCamError(
        name === "NotFoundError" || name === "OverconstrainedError" ? "notfound"
        : name === "NotReadableError" || name === "AbortError" ? "busy"
        : "denied",
      );
      setScanState("error");
      return;
    }

    if (stale()) { stream?.getTracks().forEach((t) => t.stop()); return; }
    streamRef.current = stream;

    /* ── Caminho 1: BarcodeDetector nativo (Android/macOS Chrome) ── */
    if ("BarcodeDetector" in window) {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch { /* AbortError ignorado */ }
      }
      if (stale()) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({
        formats: ["ean_13", "ean_8", "code_128", "code_39", "qr_code", "upc_a", "upc_e", "itf"],
      });
      setScanState("scanning");

      const tick = async () => {
        if (stale()) return;
        if (!videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0 && !stale()) {
            playBeep();
            stopCamera();
            onDetect(barcodes[0].rawValue as string);
            return;
          }
        } catch { /* non-fatal */ }
        if (!stale()) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    /* ── Caminho 2: zxing-js — deixa o zxing controlar o vídeo ── */
    try {
      if (stale()) return;

      const qrHints = new Map([[DecodeHintType.TRY_HARDER, false]]);
      const reader = preferQr
        ? new BrowserQRCodeReader(qrHints)
        : new BrowserMultiFormatReader();
      setScanState("scanning");

      let detected = false;
      const controls = await reader.decodeFromStream(stream, videoRef.current!, (result) => {
        if (!result || detected || stale()) return;
        detected = true;
        playBeep();
        controls.stop();
        stream!.getTracks().forEach((t) => t.stop());
        if (videoRef.current) { videoRef.current.pause(); videoRef.current.srcObject = null; }
        streamRef.current = null;
        onDetect(result.getText());
      });

      if (stale()) { controls.stop(); return; }
      zxingRef.current = { stop: () => controls.stop() };
    } catch {
      if (!stale()) setScanState("unsupported");
    }
  }, [stopCamera, onDetect, preferQr]);

  useEffect(() => {
    activeRef.current = true;
    startCamera();
    return () => {
      activeRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  function handleClose() {
    stopCamera();
    onClose?.();
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    stopCamera();
    onDetect(code);
  }

  const embedded = variant === "embedded";

  const viewport = (
    <div className={`relative w-full overflow-hidden bg-black ${embedded ? "h-[260px] sm:h-[300px] rounded-5xl" : "aspect-square rounded-5xl"}`}>
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

      {scanState === "scanning" && (
        <>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse 60% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
          }} />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`relative ${embedded ? "w-[72%] h-[62%]" : "w-52 h-52"}`}>
              {[
                "top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl",
                "top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl",
                "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl",
                "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl",
              ].map((cls) => (
                <div key={cls} className={`absolute w-9 h-9 border-accent ${cls}`} />
              ))}
              <div
                className="absolute left-3 right-3 h-[3px] rounded-full bg-accent shadow-[0_0_18px_#60a5fa]"
                style={{ animation: "scanLine 2s ease-in-out infinite", top: "50%" }}
              />
            </div>
          </div>
          <p className="absolute bottom-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-3.5 py-1.5 rounded-full bg-ink/80 text-[13px] font-extrabold text-fg">
            {embedded ? "Aponte para o código de barras" : "Escaneando…"}
          </p>
        </>
      )}

      {scanState === "requesting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
          <Spinner className="w-8 h-8 text-accent" />
          <p className="text-fg/80 text-sm font-bold">Acessando câmera…</p>
        </div>
      )}

      {scanState === "unsupported" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 px-6 text-center">
          <p className="text-fg font-black text-sm">Scanner não suportado</p>
          <p className="text-fg-muted text-[13px] font-bold">Use a entrada manual abaixo.</p>
        </div>
      )}

      {scanState === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 px-6 text-center">
          <p className="text-fg font-black text-sm">{CAM_ERROR[camError].title}</p>
          <p className="text-fg-muted text-[13px] font-bold">{CAM_ERROR[camError].desc}</p>
          <button type="button" onClick={startCamera} className="mt-1 min-h-[44px] px-4 rounded-full bg-surface-2 text-sm font-extrabold cursor-pointer hover:bg-white/10">
            Tentar novamente
          </button>
        </div>
      )}

      {scanState === "timeout" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 px-6 text-center">
          <p className="text-fg font-black text-sm">A câmera não respondeu</p>
          <p className="text-fg-muted text-[13px] font-bold">Feche outros apps que usam a câmera e tente de novo, ou digite o código abaixo.</p>
          <button type="button" onClick={startCamera} className="mt-1 min-h-[44px] px-4 rounded-full bg-surface-2 text-sm font-extrabold cursor-pointer hover:bg-white/10">
            Tentar novamente
          </button>
        </div>
      )}

      {scanState === "no_mediadevices" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 px-6 text-center">
          <p className="text-fg font-black text-sm">Câmera não disponível</p>
          <p className="text-fg-muted text-[13px] font-bold">Este navegador não liberou a câmera. Use a entrada manual abaixo.</p>
        </div>
      )}
    </div>
  );

  const manualToggle = (
    <button
      type="button"
      onClick={() => setManualMode(true)}
      className={`flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-full text-sm font-extrabold cursor-pointer transition-colors duration-200 ${
        scanState === "no_mediadevices" || scanState === "timeout" || scanState === "error" ? "text-accent" : "text-fg-muted hover:text-fg"
      }`}
    >
      <KeyboardIcon />
      {scanState === "no_mediadevices" ? "Usar entrada manual" : "Digitar código manualmente"}
    </button>
  );

  const manualForm = (
    <div className={`w-full flex flex-col gap-5 ${embedded ? "bg-surface rounded-5xl p-5" : "max-w-sm"}`}>
      <div className="text-center">
        <p className="text-fg font-black text-base">Entrada manual</p>
        <p className="text-fg-muted text-sm font-bold mt-1">Digite o código de barras</p>
      </div>
      <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          inputMode="numeric"
          name="codigo"
          autoComplete="off"
          spellCheck={false}
          aria-label="Código de barras"
          placeholder="Digite o código de barras"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          className="w-full h-14 px-4 rounded-full bg-ink text-center font-mono text-base text-fg placeholder:text-fg-subtle outline-hidden tracking-widest focus-visible:ring-2 focus-visible:ring-accent"
          autoFocus
        />
        <button
          type="submit"
          disabled={!manualCode.trim()}
          className="w-full min-h-[54px] rounded-full bg-accent text-ink text-base font-black cursor-pointer transition-[filter] duration-200 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirmar código
        </button>
      </form>
      <button
        type="button"
        onClick={() => { setManualCode(""); startCamera(); }}
        className="flex items-center justify-center gap-2 min-h-[44px] text-sm font-extrabold text-fg-muted hover:text-fg cursor-pointer transition-colors duration-200"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Voltar para câmera
      </button>
    </div>
  );

  const keyframes = (
    <style>{`
      @keyframes scanLine {
        0%, 100% { top: 20%; opacity: 0.5; }
        50% { top: 80%; opacity: 1; }
      }
    `}</style>
  );

  if (embedded) {
    return (
      <div className="flex flex-col items-center gap-2">
        {manualMode ? manualForm : <>{viewport}{manualToggle}</>}
        {keyframes}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-4 shrink-0">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fechar câmera"
          className="w-12 h-12 rounded-full bg-surface text-fg flex items-center justify-center shrink-0 cursor-pointer hover:bg-surface-2 transition-colors duration-200"
        >
          <XIcon />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-black text-fg">{title}</h2>
          <p className="text-[13px] font-bold text-fg-muted">{subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-6">
        {!manualMode && (
          <div className="w-full max-w-sm flex flex-col items-center gap-4">
            {viewport}
            {hint && scanState === "scanning" && (
              <p className="text-[13px] font-bold text-fg-muted text-center max-w-xs">{hint}</p>
            )}
            {manualToggle}
          </div>
        )}
        {manualMode && manualForm}
      </div>

      {keyframes}
    </div>
  );
}
