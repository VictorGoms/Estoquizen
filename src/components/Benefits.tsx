const BENEFITS = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Controle total",
    description:
      "Acompanhe cada produto, entrada e saída com precisão absoluta. Nunca mais perca o controle do seu inventário.",
    color: "from-blue-500/20 to-blue-600/10",
    border: "border-blue-500/20",
    iconBg: "bg-blue-500/15 text-blue-400",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Simples e rápido",
    description:
      "Interface intuitiva projetada para quem precisa de agilidade. Cadastre produtos e registre movimentações em segundos.",
    color: "from-violet-500/20 to-violet-600/10",
    border: "border-violet-500/20",
    iconBg: "bg-violet-500/15 text-violet-400",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    title: "Alertas inteligentes",
    description:
      "Receba notificações automáticas quando o estoque estiver baixo. Nunca mais fique sem produto no momento certo.",
    color: "from-amber-500/20 to-amber-600/10",
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/15 text-amber-400",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Visão do negócio",
    description:
      "Relatórios e gráficos em tempo real para decisões mais inteligentes. Entenda o desempenho do seu estoque de forma visual.",
    color: "from-emerald-500/20 to-emerald-600/10",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/15 text-emerald-400",
  },
];

export default function Benefits() {
  return (
    <section id="beneficios" className="py-24 relative">
      {/* Subtle divider glow */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(59,130,246,0.4) 50%, transparent 100%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Por que Estoquizen
          </p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white text-balance">
            Tudo que você precisa para{" "}
            <span className="text-brand-400">crescer com confiança</span>
          </h2>
          <p className="mt-4 text-slate-400 text-lg max-w-2xl mx-auto">
            Desenvolvido para pequenas e médias empresas que precisam de controle
            sem complexidade.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {BENEFITS.map((benefit) => (
            <article
              key={benefit.title}
              className={`group relative rounded-2xl p-6 bg-gradient-to-br ${benefit.color} border ${benefit.border} cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-card`}
              style={{
                backdropFilter: "blur(8px)",
              }}
            >
              {/* Hover shimmer */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)",
                }}
              />

              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${benefit.iconBg} mb-4 transition-transform duration-300 group-hover:scale-110`}>
                {benefit.icon}
              </div>

              <h3 className="font-display font-bold text-white text-lg mb-2">
                {benefit.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {benefit.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
