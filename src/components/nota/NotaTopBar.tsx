"use client";

import { useRouter } from "next/navigation";

interface NotaTopBarProps {
  title?: string;
  backHref?: string;
}

export default function NotaTopBar({ title = "Importar compra", backHref = "/dashboard" }: NotaTopBarProps) {
  const router = useRouter();

  return (
    <header
      className="fixed top-0 left-0 lg:left-60 right-0 z-40 glass"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 h-14">
          {/* Back button */}
          <button
            onClick={() => router.push(backHref)}
            className="flex items-center justify-center w-8 h-8 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer flex-shrink-0"
            aria-label="Voltar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
          </button>

          <div
            className="w-px h-5 flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />

          {/* Title */}
          <div>
            <p className="text-sm font-display font-semibold text-white leading-none">{title}</p>
            <p className="text-[10px] text-slate-600 mt-0.5 leading-none">Chave de acesso ou QR Code</p>
          </div>
        </div>
      </div>
    </header>
  );
}
