import Link from "next/link";
import HeroLoop from "./HeroLoop";
import { ArrowRightIcon, ChevronDownIcon, CheckIcon } from "@/components/ui/icons";

const TRUST = ["14 dias grátis no plano Growth", "Sem cartão para testar", "Funciona no celular e no PC"];

export default function Hero() {
  return (
    <section id="home" className="relative pt-32 pb-12 lg:pt-36 lg:pb-16 3xl:pt-44 3xl:pb-24">
      <div className="lp-container">
        <div className="grid lg:grid-cols-[1.08fr_1fr] items-center gap-12 lg:gap-16 3xl:gap-24">

          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 mb-6 text-[13px] 3xl:text-[15px] font-extrabold text-fg-soft">
              <span className="w-2 h-2 rounded-full bg-ok" />
              Estoque para pequenos negócios
            </span>

            <h1 className="text-[40px] sm:text-[56px] lg:text-[64px] 2xl:text-[76px] 3xl:text-[96px] font-black leading-[1.02] tracking-[-0.035em] text-balance mb-6">
              Controle seu estoque <span className="text-accent">de forma simples</span> e inteligente
            </h1>

            <p className="text-lg sm:text-xl 3xl:text-2xl font-semibold text-fg-muted leading-relaxed sm:leading-7 3xl:leading-8 max-w-xl 3xl:max-w-2xl mx-auto lg:mx-0 mb-9 3xl:mb-11">
              Troque a planilha por um app que lê o código de barras pela câmera, lê a nota da compra e avisa quando um produto chega ao mínimo.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/register"
                className="min-h-[56px] 3xl:min-h-[66px] inline-flex items-center justify-center gap-2.5 px-7 3xl:px-9 rounded-full bg-accent text-ink text-base 3xl:text-lg font-black hover:brightness-110 transition-[filter]"
              >
                Começar grátis <ArrowRightIcon className="w-5 h-5" strokeWidth={2.4} />
              </Link>
              <a
                href="#como-funciona"
                className="min-h-[56px] 3xl:min-h-[66px] inline-flex items-center justify-center gap-2.5 px-7 3xl:px-9 rounded-full bg-surface text-base 3xl:text-lg font-extrabold hover:bg-surface-2 transition-colors"
              >
                Ver como funciona <ChevronDownIcon className="w-5 h-5" strokeWidth={2.4} />
              </a>
            </div>

            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8 justify-center lg:justify-start">
              {TRUST.map((item) => (
                <li key={item} className="flex items-center gap-1.5 text-sm 3xl:text-base font-bold text-fg-muted">
                  <CheckIcon className="w-4 h-4 text-ok shrink-0" strokeWidth={2.8} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* zoom: o card do vídeo cresce junto com o resto do hero nas telas grandes */}
          <div className="w-full 2xl:zoom-[1.12] 3xl:zoom-[1.4]">
            <HeroLoop />
          </div>
        </div>
      </div>
    </section>
  );
}
