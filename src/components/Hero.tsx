"use client";

import { useRouter } from "next/navigation";
import DashboardMock from "./DashboardMock";

export default function Hero() {
  const router = useRouter();

  function scrollToFeatures() {
    document.querySelector("#como-funciona")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden"
    >
      {/* Background glows */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37,99,235,0.22) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute top-1/3 left-0 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(29,78,216,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Text side */}
          <div className="flex-1 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-brand-900/50 border border-brand-700/40 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
              <span className="text-xs font-medium text-brand-200 tracking-wide">
                Controle em tempo real
              </span>
            </div>

            {/* Heading */}
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight text-white text-balance mb-5">
              Controle seu estoque{" "}
              <span
                className="relative inline-block"
                style={{
                  background: "linear-gradient(90deg, #60A5FA 0%, #93C5FD 60%, #3B82F6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                de forma simples
              </span>{" "}
              e inteligente
            </h1>

            {/* Subtitle */}
            <p className="text-slate-400 text-lg sm:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
              Pare de usar planilhas e tenha controle real do seu negócio.
              Alertas automáticos, relatórios precisos e visão completa do estoque.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <button
                onClick={() => router.push("/register")}
                className="btn-primary !px-7 !py-3.5 !text-base"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Começar grátis
              </button>
              <button
                onClick={scrollToFeatures}
                className="btn-secondary !px-7 !py-3.5 !text-base"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ver como funciona
              </button>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8 justify-center lg:justify-start">
              {[
                "14 dias grátis",
                "Sem cartão de crédito",
                "Cancele quando quiser",
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-sm text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Dashboard mock */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <div className="relative">
              {/* Glow behind card */}
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at 50% 50%, rgba(37,99,235,0.18) 0%, transparent 70%)",
                  filter: "blur(32px)",
                  transform: "scale(1.1)",
                }}
              />
              <DashboardMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
