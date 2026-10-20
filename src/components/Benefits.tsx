import { ScanIcon, DocumentIcon, BellIcon, ChartIcon, UsersIcon, LayersIcon, ClockIcon, CartIcon, UploadIcon, CheckIcon } from "@/components/ui/icons";

/* Só o que o app faz hoje. */
const SMALL = [
  {
    Icon: BellIcon,
    title: "Alerta de estoque mínimo",
    text: "Cada produto tem seu mínimo. Quando a quantidade chega nele, o produto aparece no início e no sino de avisos.",
  },
  {
    Icon: ClockIcon,
    title: "Previsão de quando acaba",
    text: "Pelas saídas dos últimos 30 dias, cada produto mostra quanto ainda dura: \"dura ~5 dias\".",
  },
  {
    Icon: CartIcon,
    title: "Lista de compras pronta",
    text: "O que está no mínimo ou acaba em 7 dias vira uma lista com a quantidade sugerida, pronta para mandar no WhatsApp.",
  },
  {
    Icon: UploadIcon,
    title: "Traga sua planilha",
    text: "Importe o Excel ou CSV que você já usa. As colunas são reconhecidas e você vê a prévia antes de salvar.",
  },
  {
    Icon: CheckIcon,
    title: "Contagem do dia",
    text: "No Growth e no Pro, alguns produtos por dia para conferir em 2 minutos. Se não bater, o estoque é corrigido na hora.",
  },
  {
    Icon: ChartIcon,
    title: "Métricas por período",
    text: "Entradas, saídas e valor em estoque por período: 30 dias no Basic, até 12 meses no Pro.",
  },
  {
    Icon: UsersIcon,
    title: "Equipe com permissões",
    text: "Convide por e-mail: o administrador cuida dos produtos e o funcionário registra entradas e saídas.",
  },
  {
    Icon: LayersIcon,
    title: "Várias empresas, uma conta",
    text: "Troque de workspace em um toque se você cuida de mais de um negócio.",
  },
];

export default function Benefits() {
  return (
    <section id="recursos" className="py-14 lg:py-20 3xl:py-28 scroll-mt-20">
      <div className="lp-container">
        <div className="max-w-2xl 3xl:max-w-3xl mb-12 3xl:mb-16">
          <p className="text-sm 3xl:text-base font-extrabold text-accent mb-3">Recursos</p>
          <h2 className="text-[32px] sm:text-[44px] 2xl:text-[52px] 3xl:text-[60px] font-black leading-[1.05] tracking-[-0.03em] text-balance">
            Feito para o dia a dia do balcão e do depósito
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 3xl:gap-6">
          <article className="md:col-span-2 bg-accent text-ink rounded-5xl p-7 lg:p-8 3xl:p-11 flex flex-col gap-5 min-h-[260px] 3xl:min-h-[340px]">
            <span className="w-14 h-14 rounded-full bg-ink text-accent flex items-center justify-center">
              <ScanIcon className="w-7 h-7" />
            </span>
            <div className="mt-auto flex flex-col gap-2">
              <h3 className="text-2xl lg:text-[28px] 3xl:text-[36px] font-black tracking-tight">Entrada e saída pela câmera</h3>
              <p className="text-base 3xl:text-lg font-bold text-ink/80 max-w-md 3xl:max-w-xl">
                Aponte o celular para o código de barras, escolha entrada ou saída e confirme. Cada movimentação vai para o histórico do produto.
              </p>
            </div>
          </article>

          <article className="md:col-span-2 bg-inverse text-ink rounded-5xl p-7 lg:p-8 3xl:p-11 flex flex-col gap-5 min-h-[260px] 3xl:min-h-[340px]">
            <span className="w-14 h-14 rounded-full bg-ink text-fg flex items-center justify-center">
              <DocumentIcon className="w-7 h-7" />
            </span>
            <div className="mt-auto flex flex-col gap-2">
              <h3 className="text-2xl lg:text-[28px] 3xl:text-[36px] font-black tracking-tight">Leia a nota da compra</h3>
              <p className="text-base 3xl:text-lg font-bold text-inverse-muted max-w-md 3xl:max-w-xl">
                Leia o QR code da NFC-e, cole a chave de 44 dígitos ou envie o XML. Você revisa os itens antes de eles entrarem no estoque. O Estoquizen não emite nota fiscal: ele lê as notas das suas compras.
              </p>
            </div>
          </article>

          {SMALL.map(({ Icon, title, text }) => (
            <article key={title} className="bg-surface rounded-5xl p-6 3xl:p-8 flex flex-col gap-4">
              <span className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </span>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-lg 3xl:text-[22px] font-black leading-tight">{title}</h3>
                <p className="text-[15px] 3xl:text-[17px] font-semibold text-fg-muted leading-relaxed">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
