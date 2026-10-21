import { PLANOS } from "@/lib/planos";
import { PERGUNTAS } from "@/lib/perguntas";
import { SEGMENTOS } from "@/lib/segmentos";
import { SITE_URL, CONTATO, PRAZO_RESPOSTA } from "@/lib/site";

/*
 * Texto do /llms.txt (EQZ-47, formato de llmstxt.org): o resumo do Estoquizen para assistentes de IA
 * (ChatGPT, Claude, Perplexity) citarem certo. Montado dos mesmos dados da landing (planos, perguntas,
 * ramos), então muda sozinho quando eles mudam.
 */
export function textoLlms(): string {
  const ramos = SEGMENTOS.filter((s) => s.id !== "outro").map((s) => s.label.toLowerCase());

  const planos = PLANOS.map((p) => {
    const inclui = p.features.filter((f) => f.included).map((f) => f.text).join("; ");
    const teste  = p.trialNote ? `${p.trialNote}, sem cartão` : "começa pago, sem teste grátis";
    return `- **${p.name}** (${p.price}${p.priceNote}, ${teste}): ${inclui}.`;
  });

  const perguntas = PERGUNTAS.flatMap(({ q, a }) => [`### ${q}`, "", a, ""]);

  return [
    "# Estoquizen",
    "",
    `> App brasileiro de controle de estoque para pequenos negócios (${ramos.join(", ")}). Funciona no navegador do celular, do tablet e do computador, sem instalar nada. 14 dias grátis nos planos Basic e Growth, sem cartão.`,
    "",
    "O que o Estoquizen faz:",
    "",
    "- Entrada e saída de estoque lendo o código de barras pela câmera do celular.",
    "- Entrada pela nota de compra: XML da NF-e de qualquer estado e QR code da NFC-e de São Paulo.",
    "- Alerta quando um produto chega ao estoque mínimo e previsão de quantos dias o estoque dura.",
    "- Lista de compras com quantidade sugerida, para mandar ao fornecedor pelo WhatsApp.",
    "- Importar e exportar planilha (Excel ou CSV) e listas prontas de produtos por ramo.",
    "- Equipe com papéis (dono, administrador e membro); cada movimentação guarda quem fez.",
    "- Não emite nota fiscal: lê as notas das compras para dar entrada no estoque.",
    "",
    "## Planos",
    "",
    "Preço mensal em reais, cobrança recorrente no cartão de crédito, sem fidelidade. O cancelamento é feito no próprio app e o acesso continua até o fim do mês pago.",
    "",
    ...planos,
    "",
    "## Páginas",
    "",
    `- [Início, recursos e preços](${SITE_URL}/)`,
    `- [Criar conta grátis](${SITE_URL}/register)`,
    `- [Termos de Uso](${SITE_URL}/termos)`,
    `- [Política de Privacidade](${SITE_URL}/privacidade)`,
    "",
    "## Perguntas frequentes",
    "",
    ...perguntas,
    "## Contato",
    "",
    `E-mail: ${CONTATO}. Respondemos em até ${PRAZO_RESPOSTA}.`,
    "",
  ].join("\n");
}
