import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import { TESTE_GRATIS } from "@/lib/teste";

export default function CTA() {
  return (
    <section className="py-14 lg:py-20 3xl:py-28">
      <div className="lp-container">
        <div className="bg-accent text-ink rounded-6xl px-7 py-14 sm:px-14 sm:py-20 3xl:py-28 flex flex-col items-center text-center gap-6">
          <h2 className="text-[34px] sm:text-[52px] 3xl:text-[72px] font-black leading-[1.02] tracking-[-0.035em] text-balance max-w-3xl 3xl:max-w-5xl">
            Comece a organizar seu estoque hoje
          </h2>
          <p className="text-lg 3xl:text-[22px] font-bold text-ink/80 max-w-xl 3xl:max-w-2xl">
            Crie a conta, cadastre a empresa e registre a primeira entrada em poucos minutos.
          </p>
          <Link
            href="/register"
            className="min-h-[58px] 3xl:min-h-[66px] inline-flex items-center gap-2.5 px-8 3xl:px-10 rounded-full bg-ink text-fg text-base 3xl:text-lg font-black hover:bg-panel transition-colors"
          >
            Criar conta grátis <ArrowRightIcon className="w-5 h-5" strokeWidth={2.4} />
          </Link>
          <p className="text-sm 3xl:text-base font-extrabold text-ink/80">{TESTE_GRATIS}, sem cartão · Cancele quando quiser</p>
        </div>
      </div>
    </section>
  );
}
