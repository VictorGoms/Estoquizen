import { BoxIcon, PlusMinusIcon, ChartIcon } from "@/components/ui/icons";

const STEPS = [
  {
    Icon: BoxIcon,
    title: "Cadastre os produtos",
    text: "À mão, pelo código de barras (o nome costuma vir sozinho), lendo a nota da última compra ou importando a planilha que você já usa.",
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
    <section id="como-funciona" className="bg-panel py-16 lg:py-24 3xl:py-32 scroll-mt-20">
      <div className="lp-container">
        <div className="max-w-2xl 3xl:max-w-3xl mb-12 3xl:mb-16">
          <p className="text-sm 3xl:text-base font-extrabold text-accent mb-3">Como funciona</p>
          <h2 className="text-[32px] sm:text-[44px] 2xl:text-[52px] 3xl:text-[60px] font-black leading-[1.05] tracking-[-0.03em] text-balance">
            Três passos e o estoque está no seu bolso
          </h2>
        </div>

        <ol className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 3xl:gap-6">
          {STEPS.map(({ Icon, title, text }, i) => (
            <li key={title} className="bg-surface-2 rounded-5xl p-6 lg:p-7 3xl:p-10 flex flex-col gap-5 3xl:gap-7">
              <div className="flex items-center justify-between">
                <span className="w-12 h-12 3xl:w-14 3xl:h-14 rounded-full bg-ink flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </span>
                <span className="text-[40px] 3xl:text-[52px] font-black leading-none text-white/10" aria-hidden="true">0{i + 1}</span>
              </div>
              <div className="border-t-2 border-dashed border-white/12" />
              <div className="flex flex-col gap-1.5">
                <h3 className="text-xl 3xl:text-[26px] font-black">
                  <span className="sr-only">Passo {i + 1}: </span>{title}
                </h3>
                <p className="text-[15px] 3xl:text-[17px] font-semibold text-fg-muted leading-relaxed">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
