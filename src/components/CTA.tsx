import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";

export default function CTA() {
  return (
    <section className="py-14 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-accent text-ink rounded-6xl px-7 py-14 sm:px-14 sm:py-20 flex flex-col items-center text-center gap-6">
          <h2 className="text-[34px] sm:text-[52px] font-black leading-[1.02] tracking-[-0.035em] text-balance max-w-3xl">
            Comece a organizar seu estoque hoje
          </h2>
          <p className="text-lg font-bold text-ink/80 max-w-xl">
            Crie a conta, cadastre a empresa e registre a primeira entrada em poucos minutos.
          </p>
          <Link
            href="/register"
            className="min-h-[58px] inline-flex items-center gap-2.5 px-8 rounded-full bg-ink text-fg text-base font-black hover:bg-panel transition-colors"
          >
            Criar conta grátis <ArrowRightIcon className="w-5 h-5" strokeWidth={2.4} />
          </Link>
          <p className="text-sm font-extrabold text-ink/70">14 dias grátis no plano Growth · Cancele quando quiser</p>
        </div>
      </div>
    </section>
  );
}
