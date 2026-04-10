const STEPS = [
  {
    number: "01",
    title: "Cadastrar produtos",
    description:
      "Adicione seus produtos com nome, código, categoria e quantidade inicial. Importe em massa com planilha CSV ou cadastre manualmente em poucos cliques.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Registrar entradas e saídas",
    description:
      "Lance movimentações de estoque em tempo real. Entradas de fornecedores, saídas por vendas ou consumo — tudo registrado com histórico completo.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Acompanhar em tempo real",
    description:
      "Visualize seu estoque ao vivo, receba alertas automáticos de estoque crítico e tome decisões com base em dados confiáveis a qualquer hora.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 relative">
      {/* Background accent */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(29,78,216,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Como funciona
          </p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white text-balance">
            Comece em{" "}
            <span className="text-brand-400">3 passos simples</span>
          </h2>
          <p className="mt-4 text-slate-400 text-lg max-w-xl mx-auto">
            Sem treinamento, sem complexidade. Configure em minutos e comece a usar hoje.
          </p>
        </div>

        {/* Timeline — vertical on mobile, horizontal on desktop */}
        <div className="relative">
          {/* Desktop connector line */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-9 left-[calc(16.6%-1px)] right-[calc(16.6%-1px)] h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.4) 20%, rgba(59,130,246,0.4) 80%, transparent 100%)",
            }}
          />

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-6 relative">
            {STEPS.map((step, i) => (
              <div key={step.number} className="flex-1 flex flex-col lg:items-center">
                {/* Mobile: horizontal row with connector */}
                <div className="flex lg:flex-col items-start lg:items-center gap-5 lg:gap-0">
                  {/* Step circle */}
                  <div className="flex-shrink-0 flex flex-col lg:flex-col items-center">
                    {/* Mobile vertical connector (above, except first) */}
                    {i > 0 && (
                      <div
                        aria-hidden="true"
                        className="lg:hidden w-px h-8 -mt-8 mb-0 self-center"
                        style={{
                          background:
                            "linear-gradient(180deg, transparent 0%, rgba(59,130,246,0.4) 100%)",
                        }}
                      />
                    )}
                    <div
                      className="relative w-[72px] h-[72px] rounded-2xl flex items-center justify-center flex-shrink-0 group"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(29,78,216,0.15) 100%)",
                        border: "1px solid rgba(59,130,246,0.3)",
                        boxShadow: "0 0 24px rgba(37,99,235,0.15)",
                      }}
                    >
                      <div className="text-brand-400">{step.icon}</div>
                      {/* Number badge */}
                      <span
                        className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)" }}
                      >
                        {i + 1}
                      </span>
                    </div>
                  </div>

                  {/* Text */}
                  <div className="lg:mt-5 lg:text-center">
                    <div className="text-[10px] font-mono text-brand-500 font-semibold tracking-widest mb-1">
                      {step.number}
                    </div>
                    <h3 className="font-display font-bold text-white text-lg mb-2">
                      {step.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-xs lg:max-w-none">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
