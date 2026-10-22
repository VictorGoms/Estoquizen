import Link from "next/link";
import { PLANOS } from "@/lib/planos";
import { CheckIcon, XIcon } from "@/components/ui/icons";
import { DIAS_TESTE, OFERTA_ATE, TESTE_GRATIS } from "@/lib/teste";

/* Preços na landing (EQZ-02): os mesmos planos da escolha de plano, mais a reversão de risco. */
const GARANTIAS = [
  `${TESTE_GRATIS} em qualquer plano, sem cartão`,
  "Sem fidelidade: cancele quando quiser, pelo próprio app",
  "Seus dados são seus: exporte em planilha a qualquer momento",
];

export default function Pricing() {
  return (
    <section id="precos" className="py-14 lg:py-20 3xl:py-28 scroll-mt-20">
      <div className="lp-container">
        <div className="max-w-2xl 3xl:max-w-3xl mb-12 3xl:mb-16">
          <p className="text-sm 3xl:text-base font-extrabold text-accent mb-3">Preços</p>
          <h2 className="text-[32px] sm:text-[44px] 2xl:text-[52px] 3xl:text-[60px] font-black leading-[1.05] tracking-[-0.03em] text-balance">
            Planos simples, sem fidelidade
          </h2>
          <p className="mt-4 text-lg 3xl:text-xl font-semibold text-fg-muted leading-relaxed 3xl:leading-7">
            Cobrança mensal no cartão de crédito. Teste qualquer plano por {DIAS_TESTE} dias, sem cartão: oferta de lançamento
            para quem começar até {OFERTA_ATE}.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 3xl:gap-6 items-stretch">
          {PLANOS.map((p) => (
            <article
              key={p.id}
              className={`relative rounded-5xl p-6 lg:p-7 3xl:p-9 flex flex-col bg-surface ${p.highlighted ? "ring-2 ring-accent" : ""}`}
            >
              {p.badge && (
                <span className="absolute -top-3 left-7 text-xs font-black px-3 py-1 rounded-full bg-accent text-ink">{p.badge}</span>
              )}
              <h3 className="text-2xl 3xl:text-[28px] font-black">{p.name}</h3>
              <p className="text-sm 3xl:text-base font-bold text-fg-muted">{p.description}</p>

              {/* O selo do teste fica na linha do preço para as listas dos 3 cartões começarem na mesma altura */}
              <div className="mt-5 flex items-center flex-wrap gap-x-3 gap-y-2">
                <p className="flex items-baseline gap-1.5">
                  <span className="text-[38px] 3xl:text-[46px] font-black tracking-tight leading-none">{p.price}</span>
                  <span className="text-sm font-extrabold text-fg-muted">{p.priceNote}</span>
                </p>
                {p.trialNote && (
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-ok/15 text-ok">{p.trialNote}</span>
                )}
              </div>

              <span className="my-5 border-t-2 border-dashed border-white/12" />

              <ul className="flex flex-col gap-3 flex-1 mb-6">
                {p.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2.5">
                    {f.included ? (
                      <CheckIcon className="w-[18px] h-[18px] shrink-0 mt-px text-ok" strokeWidth={2.8} />
                    ) : (
                      <XIcon className="w-[18px] h-[18px] shrink-0 mt-px text-fg-subtle" strokeWidth={2.4} />
                    )}
                    <span className={`text-[15px] 3xl:text-base font-bold leading-snug ${f.included ? "" : "text-fg-muted line-through"}`}>
                      <span className="sr-only">{f.included ? "Inclui: " : "Não inclui: "}</span>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`min-h-[52px] flex items-center justify-center rounded-full text-base font-black transition-[filter,background-color] ${
                  p.highlighted ? "bg-accent text-ink hover:brightness-110" : "bg-surface-2 hover:bg-white/10"
                }`}
              >
                {p.trialNote ? `Testar ${TESTE_GRATIS}` : `Começar no ${p.name}`}
              </Link>
            </article>
          ))}
        </div>

        <ul className="mt-8 flex flex-col sm:flex-row flex-wrap gap-x-7 gap-y-3 justify-center">
          {GARANTIAS.map((g) => (
            <li key={g} className="flex items-center gap-2 text-[15px] 3xl:text-base font-bold text-fg-soft">
              <CheckIcon className="w-[18px] h-[18px] text-ok shrink-0" strokeWidth={2.8} />
              {g}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
