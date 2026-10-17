import { ScanIcon, DocumentIcon, BellIcon, ChartIcon, UsersIcon, LayersIcon } from "@/components/ui/icons";

/* Só o que o app faz hoje. */
const SMALL = [
  {
    Icon: BellIcon,
    title: "Alerta de estoque mínimo",
    text: "Cada produto tem seu mínimo. Quando a quantidade chega nele, o produto aparece no início e no sino de avisos.",
  },
  {
    Icon: ChartIcon,
    title: "Métricas por período",
    text: "Entradas, saídas e valor em estoque nos últimos 7 dias, 30 dias ou 3 meses.",
  },
  {
    Icon: UsersIcon,
    title: "Equipe com permissões",
    text: "Convide por e-mail e escolha quem administra e quem só consulta o estoque.",
  },
  {
    Icon: LayersIcon,
    title: "Várias empresas, uma conta",
    text: "Troque de workspace em um toque se você cuida de mais de um negócio.",
  },
];

export default function Benefits() {
  return (
    <section id="recursos" className="py-14 lg:py-20 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <p className="text-sm font-extrabold text-accent mb-3">Recursos</p>
          <h2 className="text-[32px] sm:text-[44px] font-black leading-[1.05] tracking-[-0.03em] text-balance">
            Feito para o dia a dia do balcão e do depósito
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          <article className="md:col-span-2 bg-accent text-ink rounded-5xl p-7 lg:p-8 flex flex-col gap-5 min-h-[260px]">
            <span className="w-14 h-14 rounded-full bg-ink text-accent flex items-center justify-center">
              <ScanIcon className="w-7 h-7" />
            </span>
            <div className="mt-auto flex flex-col gap-2">
              <h3 className="text-2xl lg:text-[28px] font-black tracking-tight">Entrada e saída pela câmera</h3>
              <p className="text-base font-bold text-ink/80 max-w-md">
                Aponte o celular para o código de barras, escolha entrada ou saída e confirme. Cada movimentação vai para o histórico do produto.
              </p>
            </div>
          </article>

          <article className="md:col-span-2 bg-inverse text-ink rounded-5xl p-7 lg:p-8 flex flex-col gap-5 min-h-[260px]">
            <span className="w-14 h-14 rounded-full bg-ink text-fg flex items-center justify-center">
              <DocumentIcon className="w-7 h-7" />
            </span>
            <div className="mt-auto flex flex-col gap-2">
              <h3 className="text-2xl lg:text-[28px] font-black tracking-tight">Importe a nota da compra</h3>
              <p className="text-base font-bold text-inverse-muted max-w-md">
                Leia o QR code da NFC-e, cole a chave de 44 dígitos ou envie o XML. Você revisa os itens antes de eles entrarem no estoque.
              </p>
            </div>
          </article>

          {SMALL.map(({ Icon, title, text }) => (
            <article key={title} className="bg-surface rounded-5xl p-6 flex flex-col gap-4">
              <span className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </span>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-lg font-black leading-tight">{title}</h3>
                <p className="text-[15px] font-semibold text-fg-muted leading-relaxed">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
