import Link from "next/link";
import PaginaLegal, { Secao, DADOS_LEGAIS } from "@/components/legal/PaginaLegal";
import { metadadosDaPagina } from "@/lib/site";
import { COBRA_DESDE_ANO, DIAS_MINIMOS, GRATIS_ATE_ANO, MINIMO_DESDE } from "@/lib/teste";

export const metadata = metadadosDaPagina("Termos de Uso", "As regras para usar o Estoquizen: conta, planos, cobrança, cancelamento e responsabilidades.", "/termos");

/* EQZ-10. Rascunho de 2026-10-21 com as regras que o app aplica hoje (teste, cobrança, pausa,
   cancelamento, exclusão). Mudou uma regra? Mude aqui também. Não é parecer jurídico. */
export default function TermosPage() {
  const { responsavel, contato, foro } = DADOS_LEGAIS;
  return (
    <PaginaLegal titulo="Termos de Uso" resumo="As regras para usar o Estoquizen: conta, planos, cobrança, cancelamento e responsabilidades.">
      <Secao titulo="1. Aceitação">
        <p>
          Ao criar uma conta ou usar o Estoquizen (estoquizen.com.br), serviço operado por <strong>{responsavel}</strong>, você concorda
          com estes Termos e com a <Link href="/privacidade">Política de Privacidade</Link>. Se não concordar, não use o serviço.
        </p>
      </Secao>

      <Secao titulo="2. O serviço">
        <p>
          O Estoquizen é um sistema online de controle de estoque: cadastro de produtos, entradas e saídas, leitor de código de
          barras, leitura de notas de compra, alertas de estoque baixo, lista de compras, métricas e equipe.
        </p>
        <ul>
          <li>O Estoquizen <strong>não emite nota fiscal</strong>: ele lê as notas das suas compras para dar entrada no estoque.</li>
          <li>A leitura de NFC-e depende dos portais das Secretarias da Fazenda e pode não funcionar em todos os estados. O XML da nota funciona para qualquer estado.</li>
          <li>Os recursos de cada plano estão na <Link href="/#precos">página de preços</Link>.</li>
        </ul>
      </Secao>

      <Secao titulo="3. Sua conta">
        <ul>
          <li>Você precisa ter 18 anos ou mais e informar dados verdadeiros.</li>
          <li>Você é responsável pela sua senha e pelo que for feito com a sua conta. Se perceber um acesso indevido, use &quot;Sair de todos os aparelhos&quot; no Perfil e troque a senha.</li>
          <li>Uma conta pode participar de várias empresas (workspaces).</li>
        </ul>
      </Secao>

      <Secao titulo="4. Empresa e equipe">
        <p>
          Quem cria a empresa é o dono: é responsável por ela e pela assinatura, convida a equipe e define o papel de cada pessoa.
          O dono garante que tem autorização para incluir dados de terceiros, como os da equipe e dos fornecedores.
        </p>
      </Secao>

      <Secao titulo="5. Planos, teste grátis e cobrança">
        <ul>
          <li>Os planos são mensais e cobrados no cartão de crédito pelo Stripe. A assinatura se renova sozinha todo mês até ser cancelada.</li>
          <li>Oferta de lançamento: todos os planos são <strong>grátis até {GRATIS_ATE_ANO}</strong> (inclusive), sem cartão, um teste por pessoa e por CPF. Quem começar a partir de {MINIMO_DESDE} tem {DIAS_MINIMOS} dias grátis. A cobrança só começa em {COBRA_DESDE_ANO} (ou no fim dos {DIAS_MINIMOS} dias) e só se você escolher um plano e cadastrar o cartão. Depois dessa oferta o teste grátis pode mudar, e o que valer aparece na página de preços na hora do cadastro. No fim do teste nada é cobrado: a empresa fica bloqueada até você escolher um plano.</li>
          <li>Trocar de plano vale na hora. Ao subir, é cobrada a diferença proporcional do mês; ao descer, o valor não usado vira crédito nas próximas faturas. Só dá para descer se os produtos e a equipe couberem no plano novo.</li>
          <li>Em vez de cancelar, você pode <strong>pausar por 1 ou 2 meses</strong>: usa normalmente até o fim do mês já pago, depois a empresa fica bloqueada, sem cobrança, e volta sozinha. Dá para retomar antes.</li>
          <li>Se o pagamento falhar, o Stripe tenta de novo por alguns dias. Se não conseguir, a assinatura é encerrada.</li>
          <li>Mudanças de preço são avisadas por e-mail com pelo menos 30 dias de antecedência e valem a partir da renovação seguinte.</li>
        </ul>
      </Secao>

      <Secao titulo="6. Cancelamento, reembolso e exclusão">
        <ul>
          <li>Você pode cancelar quando quiser, em Configurações, sem multa nem fidelidade. O cancelamento vale no fim do mês já pago.</li>
          <li><strong>Direito de arrependimento:</strong> no primeiro pagamento de uma assinatura, você pode desistir em até 7 dias e recebe o valor de volta (Código de Defesa do Consumidor, art. 49). É só usar &quot;Desistir e receber o valor de volta&quot; em Configurações (ou escrever para o contato abaixo): a assinatura é cancelada na hora e o valor volta no mesmo cartão (se foi pago por boleto, combinamos a devolução por Pix ou transferência). Pelo app, a desistência vale uma vez por pessoa; nas seguintes, o pedido é feito pelo contato abaixo. Fora desse caso, não há devolução proporcional do mês em curso.</li>
          <li>Depois que a assinatura termina, a empresa fica bloqueada e os dados ficam guardados por 30 dias para você voltar ou exportar. Avisamos por e-mail antes de excluir. Depois desse prazo, os dados são apagados de forma definitiva.</li>
          <li>Excluir a empresa em Configurações apaga tudo na hora e cancela a assinatura paga.</li>
        </ul>
      </Secao>

      <Secao titulo="7. Uso permitido">
        <p>Não é permitido usar o Estoquizen para:</p>
        <ul>
          <li>atividades ilegais ou para guardar dados obtidos de forma ilegal;</li>
          <li>tentar acessar dados de outras empresas ou contas, ou burlar os limites dos planos;</li>
          <li>sobrecarregar ou atacar o sistema, ou revender o acesso sem autorização.</li>
        </ul>
        <p>Contas que violarem estas regras podem ser suspensas.</p>
      </Secao>

      <Secao titulo="8. Seus dados">
        <p>
          Os dados do seu estoque são seus. Você autoriza o Estoquizen a guardá-los e processá-los só para prestar o serviço, e pode
          exportá-los em planilha a qualquer momento. A única coisa usada para ajudar outros clientes é o par código de barras e
          nome do produto, para sugerir o nome a quem cadastrar o mesmo código, sem identificar a sua empresa (detalhes na Política
          de Privacidade). Você é responsável pela exatidão do que inclui e pelas decisões tomadas a partir
          desses dados, como compras e preços.
        </p>
      </Secao>

      <Secao titulo="9. Disponibilidade">
        <p>
          Trabalhamos para manter o Estoquizen no ar o tempo todo, mas pode haver interrupções por manutenção ou por falhas de
          provedores. Sempre que possível, avisamos as manutenções programadas com antecedência.
        </p>
      </Secao>

      <Secao titulo="10. Responsabilidade">
        <p>
          O Estoquizen é uma ferramenta de apoio à gestão do estoque e não garante resultados. Nos limites permitidos pela lei,
          especialmente pelo Código de Defesa do Consumidor, não respondemos por prejuízos causados por dados incluídos errado, por uso
          indevido da conta pelo próprio usuário ou por indisponibilidade de serviços de terceiros, como os portais das Secretarias da
          Fazenda e o Open Food Facts.
        </p>
      </Secao>

      <Secao titulo="11. Propriedade intelectual">
        <p>
          A marca, o código e o visual do Estoquizen são protegidos. Ícones e dados de terceiros seguem as licenças listadas em{" "}
          <Link href="/licencas">Licenças</Link>.
        </p>
      </Secao>

      <Secao titulo="12. Mudanças nestes Termos">
        <p>
          Mudanças relevantes são avisadas por e-mail ou no app com pelo menos 30 dias de antecedência. Continuar usando o serviço
          depois disso significa aceitar os novos Termos.
        </p>
      </Secao>

      <Secao titulo="13. Lei e foro">
        <p>
          Estes Termos seguem as leis do Brasil. Se você for consumidor, vale o foro do seu domicílio; nos demais casos, fica eleito
          o foro da comarca de {foro}.
        </p>
      </Secao>

      <Secao titulo="14. Contato">
        <p>Dúvidas sobre estes Termos: <a href={`mailto:${contato}`}>{contato}</a>.</p>
      </Secao>
    </PaginaLegal>
  );
}
