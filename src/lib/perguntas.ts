import { CONTATO, PRAZO_RESPOSTA } from "@/lib/site";

/*
 * Perguntas frequentes (EQZ-02): as objeções de quem ainda usa caderno ou planilha. Aparecem na
 * landing (com JSON-LD FAQPage) e no /llms.txt (EQZ-47).
 * Só o que o app faz hoje; mudou uma regra (trial, exclusão, papéis, estados da NFC-e)? Mude aqui.
 */
export const PERGUNTAS: { q: string; a: string }[] = [
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
    a: "Os planos Basic e Growth têm 14 dias grátis, sem cartão (um teste por pessoa); o Pro começa pago. No fim do teste, você escolhe um plano para continuar. Se não escolher, nada é cobrado: o workspace fica bloqueado, mas você ainda exporta os dados em planilha por 30 dias.",
  },
  {
    q: "Tem fidelidade ou multa para cancelar?",
    a: "Não. A cobrança é mensal no cartão de crédito e você cancela quando quiser, pelo próprio app. O acesso continua até o fim do mês já pago.",
  },
  {
    q: "Se eu cancelar, levo meus dados?",
    a: "Sim. Você exporta produtos e movimentações em planilha quando quiser, inclusive depois de cancelar. Depois do fim da assinatura o workspace fica bloqueado, mas os dados ficam guardados por 30 dias para exportar ou assinar de novo, e ninguém é excluído sem aviso por e-mail antes.",
  },
  {
    q: "Como falo com vocês?",
    a: `Pelo e-mail ${CONTATO}. Respondemos em até ${PRAZO_RESPOSTA}.`,
  },
];
