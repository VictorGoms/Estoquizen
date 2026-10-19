import { ClockIcon, CartIcon, UsersIcon } from "@/components/ui/icons";

/* A dor de quem controla o estoque no caderno, e o posicionamento (EQZ-02). */
const DORES = [
  {
    Icon: ClockIcon,
    title: "Faltou na hora do movimento",
    text: "Você descobre que acabou quando o cliente pede. Aí é correr no atacado ou perder a venda.",
  },
  {
    Icon: CartIcon,
    title: "Comprou o que já tinha",
    text: "Sem saber o que tem no depósito, a compra vai no chute e o dinheiro fica parado na prateleira.",
  },
  {
    Icon: UsersIcon,
    title: "Ninguém sabe quem mexeu",
    text: "Caderno e planilha não contam quem tirou o quê. No fim do mês, a conta não fecha.",
  },
];

export default function Problem() {
  return (
    <section id="problema" className="py-14 lg:py-20 3xl:py-28 scroll-mt-20">
      <div className="lp-container">
        <div className="max-w-2xl 3xl:max-w-3xl mb-12 3xl:mb-16">
          <p className="text-sm 3xl:text-base font-extrabold text-accent mb-3">O problema</p>
          <h2 className="text-[32px] sm:text-[44px] 2xl:text-[52px] 3xl:text-[60px] font-black leading-[1.05] tracking-[-0.03em] text-balance">
            Estoque no caderno só avisa quando já acabou
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 3xl:gap-6">
          {DORES.map(({ Icon, title, text }) => (
            <article key={title} className="bg-surface rounded-5xl p-6 lg:p-7 3xl:p-9 flex flex-col gap-4">
              <span className="w-12 h-12 rounded-full bg-low/15 text-low flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </span>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-xl 3xl:text-[26px] font-black leading-tight">{title}</h3>
                <p className="text-[15px] 3xl:text-[17px] font-semibold text-fg-muted leading-relaxed">{text}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-4 lg:mt-5 3xl:mt-6 bg-accent text-ink rounded-5xl px-7 py-8 lg:px-10 lg:py-10 3xl:px-14 3xl:py-14 text-[22px] sm:text-[28px] 3xl:text-[38px] font-black leading-tight tracking-[-0.02em] text-balance">
          Para quem controla o estoque no caderno, na planilha ou no olho: o Estoquizen diz o que comprar antes de acabar. Sem ERP e sem complicação.
        </p>
      </div>
    </section>
  );
}
