import { ChevronDownIcon } from "@/components/ui/icons";
import { PERGUNTAS } from "@/lib/perguntas";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PERGUNTAS.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

export default function Faq() {
  return (
    <section id="perguntas" className="bg-panel py-16 lg:py-24 3xl:py-32 scroll-mt-20">
      <div className="lp-container">
        <div className="grid lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-16">
          <div className="max-w-xl">
            <p className="text-sm 3xl:text-base font-extrabold text-accent mb-3">Perguntas frequentes</p>
            <h2 className="text-[32px] sm:text-[44px] 2xl:text-[52px] 3xl:text-[60px] font-black leading-[1.05] tracking-[-0.03em] text-balance">
              Antes de trocar o caderno
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {PERGUNTAS.map(({ q, a }) => (
              <details key={q} className="group bg-surface-2 rounded-4xl">
                <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer min-h-[60px] px-5 lg:px-6 py-4 flex items-center justify-between gap-4 rounded-4xl text-[17px] 3xl:text-xl font-black focus-visible:ring-2 focus-visible:ring-accent">
                  {q}
                  <ChevronDownIcon className="w-5 h-5 shrink-0 text-fg-muted transition-transform duration-200 group-open:rotate-180" strokeWidth={2.4} />
                </summary>
                <p className="px-5 lg:px-6 pb-5 -mt-1 text-[15px] 3xl:text-[17px] font-semibold text-fg-muted leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </section>
  );
}
