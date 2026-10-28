import { GRATIS_ATE } from "@/lib/teste";

/*
 * Preço do plano no lançamento grátis (decisão do João em 2026-10-28): o preço normal riscado, "R$ 0,00 até 05/01"
 * e o que vale depois. Sem o "depois", parece grátis para sempre (o CDC pede oferta clara). Na landing e na
 * escolha de plano. Depois de 05/01, voltar a mostrar só o preço.
 */
export default function PrecoPlano({ price, priceNote, tamanho, muted }: {
  price:     string;
  priceNote: string;
  /** classes do tamanho do "R$ 0,00" */
  tamanho:   string;
  /** cor do texto secundário (o cartão selecionado da escolha de plano é claro) */
  muted:     string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <s className={`text-sm font-extrabold ${muted}`}>
        <span className="sr-only">Preço normal: </span>{price}{priceNote}
      </s>
      <p className="flex items-baseline gap-1.5">
        <span className={`${tamanho} font-black tracking-tight leading-none`}>R$ 0,00</span>
        <span className={`text-sm font-extrabold ${muted}`}>até {GRATIS_ATE}</span>
      </p>
      <p className={`text-[13px] font-bold ${muted}`}>Depois, {price}{priceNote}. Sem cartão até lá.</p>
    </div>
  );
}
