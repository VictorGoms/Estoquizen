"use client";

import { useRouter } from "next/navigation";

export default function CTA() {
  const router = useRouter();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative rounded-3xl px-8 py-16 sm:px-16 sm:py-20 text-center overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)",
            boxShadow: "0 24px 80px rgba(29,78,216,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          {/* Decorative blobs */}
          <div
            aria-hidden="true"
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(29,78,216,0.3) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          {/* Grid pattern overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10">
            <p className="text-blue-200/80 text-sm font-semibold uppercase tracking-widest mb-4">
              Pronto para começar?
            </p>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white leading-tight text-balance mb-5">
              Comece a organizar seu estoque hoje
            </h2>
            <p className="text-blue-100/70 text-lg max-w-xl mx-auto mb-10">
              Junte-se a centenas de empresas que já trocaram as planilhas pelo
              controle inteligente.
            </p>

            <button
              onClick={() => router.push("/register")}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-display font-bold text-base cursor-pointer text-blue-900 bg-white hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Criar conta grátis
            </button>

            <p className="mt-5 text-blue-200/60 text-sm">
              14 dias grátis&nbsp;&nbsp;•&nbsp;&nbsp;Sem cartão de crédito&nbsp;&nbsp;•&nbsp;&nbsp;Cancele quando quiser
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
