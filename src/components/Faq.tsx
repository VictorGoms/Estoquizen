import { ChevronDownIcon } from "@/components/ui/icons";

/*
 * Perguntas frequentes (EQZ-02): as objeções de quem ainda usa caderno ou planilha.
 * Só o que o app faz hoje; mudou uma regra (trial, exclusão, papéis, estados da NFC-e)? Mude aqui.
 */
const PERGUNTAS = [
  {
    q: "Preciso de computador?",
    a: "Não. O Estoquizen funciona no navegador do celular, do tablet ou do computador, sem instalar nada. A câmera do celular lê o código de barras.",
  },
  {
    q: "Funciona com internet ruim?",
    a: "Precisa de internet para salvar as entradas e saídas, mas é leve: o 4G do celular dá conta. Sem nenhuma conexão, a movimentação não é registrada.",
  },
  {
    q: "Meu funcionário consegue usar?",
    a: "Sim. Convide por e-mail e cada pessoa entra com a própria conta. Quem fica como membro registra entradas, saídas e a contagem do dia, sem mexer no cadastro dos produtos; quem você deixa como administrador também cadastra produtos, lê notas e cuida da equipe. Cada movimentação guarda quem fez.",
  },
  {
    q: "O Estoquizen emite nota fiscal?",
    a: "Não. O Estoquizen não emite nota fiscal: ele lê as notas das suas compras para dar entrada no estoque. Para vender com nota, continue usando o seu emissor ou o seu PDV.",
  },
  {
    q: "A leitura da nota funciona no meu estado?",
    a: "O XML da NF-e funciona com nota de qualquer estado. A leitura do QR code ou da chave do cupom (NFC-e), por enquanto, está garantida em São Paulo. Se não funcionar, envie o XML ou cadastre à mão.",
  },
  {
    q: "Já tenho tudo numa planilha. Preciso cadastrar de novo?",
    a: "Não. Importe o Excel (.xlsx) ou um CSV: o Estoquizen reconhece as colunas (nome, código, quantidade, preço…) e mostra uma prévia antes de salvar.",
  },
  {
    q: "Como funciona o teste grátis?",
    a: "O plano Growth tem 14 dias grátis, sem cartão. No fim do teste, você escolhe um plano para continuar. Se não escolher, nada é cobrado: o workspace fica bloqueado, mas você ainda exporta os dados em planilha por 30 dias.",
  },
  {
    q: "Tem fidelidade ou multa para cancelar?",
    a: "Não. A cobrança é mensal no cartão de crédito e você cancela quando quiser, pelo próprio app. O acesso continua até o fim do mês já pago.",
  },
  {
    q: "Se eu cancelar, levo meus dados?",
    a: "Sim. Você exporta produtos e movimentações em planilha quando quiser, inclusive depois de cancelar. Depois do fim da assinatura o workspace fica bloqueado, mas os dados ficam guardados por 30 dias para exportar ou assinar de novo, e ninguém é excluído sem aviso por e-mail antes.",
  },
];

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
