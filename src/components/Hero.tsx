import Link from "next/link";
import DashboardMock from "./DashboardMock";
import { ArrowRightIcon, ChevronDownIcon, CheckIcon } from "@/components/ui/icons";

const TRUST = ["14 dias grátis no plano Growth", "Sem cartão para testar", "Funciona no celular e no PC"];

export default function Hero() {
  return (
    <section id="home" className="relative pt-32 pb-12 lg:pt-36 lg:pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          <div className="flex-1 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 mb-6 text-[13px] font-extrabold text-fg-soft">
              <span className="w-2 h-2 rounded-full bg-ok" />
              Estoque para pequenos negócios
            </span>

            <h1 className="text-[40px] sm:text-[56px] lg:text-[64px] font-black leading-[1.02] tracking-[-0.035em] text-balance mb-6">
              Controle seu estoque <span className="text-accent">de forma simples</span> e inteligente
            </h1>

            <p className="text-lg sm:text-xl font-semibold text-fg-muted leading-relaxed max-w-xl mx-auto lg:mx-0 mb-9">
              Troque a planilha por um app que lê o código de barras pela câmera, importa a nota da compra e avisa quando um produto chega ao mínimo.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/register"
                className="min-h-[56px] inline-flex items-center justify-center gap-2.5 px-7 rounded-full bg-accent text-ink text-base font-black hover:brightness-110 transition-[filter]"
              >
                Começar grátis <ArrowRightIcon className="w-5 h-5" strokeWidth={2.4} />
              </Link>
              <a
                href="#como-funciona"
                className="min-h-[56px] inline-flex items-center justify-center gap-2.5 px-7 rounded-full bg-surface text-base font-extrabold hover:bg-surface-2 transition-colors"
              >
                Ver como funciona <ChevronDownIcon className="w-5 h-5" strokeWidth={2.4} />
              </a>
            </div>

            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8 justify-center lg:justify-start">
              {TRUST.map((item) => (
                <li key={item} className="flex items-center gap-1.5 text-sm font-bold text-fg-muted">
                  <CheckIcon className="w-4 h-4 text-ok flex-shrink-0" strokeWidth={2.8} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-1 w-full">
            <DashboardMock />
          </div>
        </div>
      </div>
    </section>
  );
}
