"use client";

import { useRouter } from "next/navigation";

export default function ConviteInvalidoPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "600px", height: "350px",
          background: "radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-md relative text-center flex flex-col items-center gap-6">
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#FCA5A5" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>

        <div>
          <h1 className="font-display font-bold text-xl text-white mb-2">Convite inválido</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Este convite foi cancelado ou já expirou.<br />
            Entre em contato com o administrador do workspace para receber um novo convite.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.replace("/login")}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
            boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
          }}
        >
          Ir para o login
        </button>
      </div>
    </div>
  );
}
