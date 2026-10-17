import { ScanIcon, DocumentIcon, ArrowUpRightIcon, PlusIcon } from "@/components/ui/icons";

/* Ilustração da tela de Início do app (dados de exemplo). Decorativa para leitores de tela. */
const ALERTS = [
  { initials: "Ca", name: "Café torrado 500g", meta: "0 de 10 un mínimo", label: "Zerado", chip: "bg-zero/15 text-zero", dot: "bg-zero", fill: 0 },
  { initials: "Fe", name: "Feijão carioca 1kg", meta: "8 de 12 un mínimo", label: "Baixo", chip: "bg-low/15 text-low", dot: "bg-low", fill: 67 },
];

export default function DashboardMock() {
  return (
    <div aria-hidden="true" className="relative w-full max-w-[440px] mx-auto rounded-[40px] bg-panel p-4 sm:p-5 shadow-lift select-none">
      <div className="flex items-center gap-3 px-1 pb-4">
        <span className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-sm font-black">AN</span>
        <span className="flex-1 min-w-0">
          <span className="block text-[17px] font-black leading-tight">Boa tarde, Ana!</span>
          <span className="block text-[13px] font-bold text-fg-muted">Mercadinho do Bairro</span>
        </span>
      </div>

      <div className="relative bg-accent text-ink rounded-[30px] p-5 flex flex-col gap-3.5">
        <div>
          <p className="text-[13px] font-extrabold text-ink/80">Valor em estoque</p>
          <p className="text-[38px] sm:text-[42px] font-black tracking-[-0.035em] leading-none mt-1">R$ 18.420<span className="text-xl">,00</span></p>
        </div>
        <div className="border-t-2 border-dashed border-ink/20" />
        <div className="grid grid-cols-3 gap-2">
          {[["248", "Produtos"], ["12", "Em alerta"], ["86", "Mov. 7 dias"]].map(([v, l]) => (
            <div key={l}>
              <p className="text-[22px] font-black leading-tight">{v}</p>
              <p className="text-xs font-extrabold text-ink/75">{l}</p>
            </div>
          ))}
        </div>
        <span className="absolute -top-3 right-5 w-[54px] h-[54px] rounded-full bg-panel border-[6px] border-panel flex items-center justify-center">
          <span className="w-full h-full rounded-full bg-surface-2 text-fg flex items-center justify-center"><PlusIcon className="w-5 h-5" strokeWidth={2.4} /></span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="bg-inverse text-ink rounded-[26px] p-3.5 flex flex-col gap-2.5">
          <span className="flex justify-between items-start">
            <span className="w-10 h-10 rounded-full bg-ink text-accent flex items-center justify-center"><ScanIcon className="w-5 h-5" /></span>
            <ArrowUpRightIcon className="w-[18px] h-[18px] text-inverse-muted" strokeWidth={2.2} />
          </span>
          <span className="text-base font-black leading-tight">Escanear</span>
          <span className="text-xs font-bold text-inverse-muted -mt-1.5">Entrada ou saída</span>
        </div>
        <div className="bg-surface rounded-[26px] p-3.5 flex flex-col gap-2.5">
          <span className="flex justify-between items-start">
            <span className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center"><DocumentIcon className="w-5 h-5" /></span>
            <ArrowUpRightIcon className="w-[18px] h-[18px] text-fg-subtle" strokeWidth={2.2} />
          </span>
          <span className="text-base font-black leading-tight">Importar nota</span>
          <span className="text-xs font-bold text-fg-muted -mt-1.5">Chave de 44 dígitos</span>
        </div>
      </div>

      <div className="mt-3 bg-surface rounded-[26px] p-3.5 flex flex-col gap-2.5">
        <p className="text-sm font-black px-1">Precisa de atenção</p>
        {ALERTS.map((a) => (
          <div key={a.name} className="flex items-center gap-3 p-2.5 rounded-[18px] bg-surface-2">
            <span className="w-9 h-9 rounded-full bg-ink flex items-center justify-center text-xs font-black flex-shrink-0">{a.initials}</span>
            <span className="flex-1 min-w-0 flex flex-col gap-1">
              <span className="flex justify-between items-center gap-2">
                <span className="text-[13px] font-extrabold truncate">{a.name}</span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${a.chip}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />{a.label}
                </span>
              </span>
              <span className="block h-1 rounded-full bg-ink"><span className="block h-full rounded-full bg-low" style={{ width: `${a.fill}%` }} /></span>
              <span className="text-[11px] font-bold text-fg-muted">{a.meta}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
