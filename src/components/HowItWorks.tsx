import { BoxIcon, PlusMinusIcon, ChartIcon } from "@/components/ui/icons";

const STEPS = [
  {
    Icon: BoxIcon,
    title: "Cadastre os produtos",
    text: "À mão, pelo código de barras (o nome costuma vir sozinho) ou importando a NFC-e da última compra.",
  },
  {
    Icon: PlusMinusIcon,
    title: "Registre entradas e saídas",
    text: "Pela câmera, pela lista do estoque ou pela ficha do produto. Cada movimentação fica no histórico, com motivo.",
  },
  {
    Icon: ChartIcon,
    title: "Acompanhe sem planilha",
    text: "O início mostra o valor em estoque, o que está acabando e o movimento da semana.",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-14 lg:py-20 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <p className="text-sm font-extrabold text-accent mb-3">Como funciona</p>
          <h2 className="text-[32px] sm:text-[44px] font-black leading-[1.05] tracking-[-0.03em] text-balance">
            Três passos e o estoque está no seu bolso
          </h2>
        </div>

        <ol className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
          {STEPS.map(({ Icon, title, text }, i) => (
            <li key={title} className="bg-surface rounded-5xl p-6 lg:p-7 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <span className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </span>
                <span className="text-[40px] font-black leading-none text-white/10" aria-hidden="true">0{i + 1}</span>
              </div>
              <div className="border-t-2 border-dashed border-white/[0.12]" />
              <div className="flex flex-col gap-1.5">
                <h3 className="text-xl font-black">
                  <span className="sr-only">Passo {i + 1}: </span>{title}
                </h3>
                <p className="text-[15px] font-semibold text-fg-muted leading-relaxed">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
