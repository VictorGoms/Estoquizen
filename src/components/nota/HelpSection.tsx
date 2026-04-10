const FAQ = [
  {
    q: "Onde encontro a chave de acesso?",
    a: "A chave de acesso fica impressa no DANFE (espelho da NF-e), geralmente abaixo do código de barras, com 44 dígitos numéricos.",
  },
  {
    q: "Posso escanear pelo celular?",
    a: 'Sim. Toque em "Escanear QR Code" e aponte a câmera para o QR Code impresso na nota.',
  },
  {
    q: "A nota não foi encontrada. O que fazer?",
    a: "Verifique se a chave tem exatamente 44 dígitos e se a nota já foi autorizada pela SEFAZ.",
  },
];

const QuestionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export default function HelpSection() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(30,41,59,0.5)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-brand-400"
          style={{ background: "rgba(29,78,216,0.2)" }}
        >
          <QuestionIcon />
        </div>
        <p className="font-display font-semibold text-sm text-white">Perguntas frequentes</p>
      </div>

      {/* Two-column on desktop */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: FAQ list */}
        <div className="flex flex-col gap-4">
          {FAQ.map((item) => (
            <div key={item.q}>
              <p className="text-xs font-semibold text-slate-300 mb-1">{item.q}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>

        {/* Right: visual DANFE illustration */}
        <div
          className="rounded-xl flex flex-col items-center justify-center gap-3 py-6 px-4 text-center"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <DocumentIcon />
          <div>
            <p className="text-xs font-semibold text-slate-400">Exemplo de DANFE</p>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed max-w-[180px]">
              A chave aparece logo abaixo do código de barras no documento impresso.
            </p>
          </div>
          {/* Simulated barcode */}
          <div className="flex gap-px items-end h-8 mt-1" aria-hidden="true">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className="w-[3px] rounded-sm"
                style={{
                  height: `${(i % 3 === 0 ? 100 : i % 2 === 0 ? 75 : 60)}%`,
                  background: "rgba(148,163,184,0.25)",
                }}
              />
            ))}
          </div>
          <p className="text-[9px] font-mono text-slate-700 tracking-widest">
            3524 0714 4501 0100 0185
          </p>
        </div>
      </div>
    </div>
  );
}
