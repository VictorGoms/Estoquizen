import Link from "next/link";
import PaginaLegal, { Secao, DADOS_LEGAIS } from "@/components/legal/PaginaLegal";
import { metadadosDaPagina } from "@/lib/site";

export const metadata = metadadosDaPagina("Política de Privacidade", "Quais dados o Estoquizen usa, para quê, com quem compartilha e quais são os seus direitos (LGPD).", "/privacidade");

/* EQZ-10 (LGPD). Rascunho de 2026-10-21 escrito a partir do que o app faz de verdade: mudou o que
   o app coleta, guarda ou com quem compartilha? Mude aqui. Não é parecer jurídico. */
export default function PrivacidadePage() {
  const { responsavel, contato } = DADOS_LEGAIS;
  return (
    <PaginaLegal titulo="Política de Privacidade" resumo="Quais dados o Estoquizen usa, para quê, com quem compartilha e quais são os seus direitos.">
      <Secao titulo="1. Quem cuida dos seus dados">
        <p>
          O Estoquizen (estoquizen.com.br) é um serviço de controle de estoque operado por <strong>{responsavel}</strong>, que é o
          controlador dos dados pessoais tratados no serviço, nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018, LGPD).
        </p>
        <p>Para qualquer assunto de privacidade, escreva para <a href={`mailto:${contato}`}>{contato}</a>.</p>
      </Secao>

      <Secao titulo="2. Que dados usamos">
        <ul>
          <li><strong>Cadastro:</strong> nome, e-mail, senha (guardada só em formato irreversível), telefone (opcional) e foto de perfil (opcional). No login com Google, recebemos nome, e-mail e foto da sua conta Google.</li>
          <li><strong>CPF:</strong> pedido ao criar uma empresa, para identificar quem é o titular da assinatura e garantir um teste grátis por pessoa. Para esse controle guardamos também uma versão codificada e irreversível do CPF.</li>
          <li><strong>Empresa (workspace):</strong> nome, descrição e ramo do negócio.</li>
          <li><strong>Dados de estoque</strong> que você e sua equipe incluem: produtos, códigos de barras, preços, custos, quantidades, fotos, entradas e saídas (com quem fez e quando), contagens, lista de compras e as notas de compra lidas (chave, fornecedor e itens).</li>
          <li><strong>Equipe:</strong> nome e e-mail das pessoas convidadas, papel e situação do convite.</li>
          <li><strong>Pagamento:</strong> é feito pelo Stripe. O Estoquizen não recebe nem guarda o número do cartão; guardamos só os identificadores da assinatura no Stripe, o plano, a situação e as datas.</li>
          <li><strong>Cancelamento:</strong> o motivo, quando você responde a pergunta ao cancelar.</li>
          <li><strong>Dados técnicos:</strong> endereço IP e dados do navegador nos registros dos nossos provedores de hospedagem, usados para segurança e para limitar abusos; e dados guardados no seu navegador para manter a sessão e suas preferências. Não usamos cookies de publicidade.</li>
          <li><strong>Uso do app (só se você aceitar os cookies de análise):</strong> páginas visitadas, cliques e ações como cadastrar um produto ou registrar uma entrada, ligados a um identificador da sua conta. Não enviamos nome, e-mail, CPF, nomes de produtos nem o que você digita, e não gravamos a tela.</li>
        </ul>
      </Secao>

      <Secao titulo="3. Para que usamos">
        <ul>
          <li><strong>Prestar o serviço que você contratou</strong> (execução do contrato): sua conta, o estoque, a equipe, a cobrança e os e-mails do serviço, como convite, confirmação de assinatura e avisos de fim de teste, de pausa e de exclusão.</li>
          <li><strong>Segurança e prevenção de abuso</strong> (legítimo interesse): limite de tentativas, um teste grátis por pessoa e proteção das contas.</li>
          <li><strong>Melhorar o produto:</strong> estatísticas de uso do app, só com o seu consentimento (cookies de análise), e os motivos de cancelamento (legítimo interesse), olhados em conjunto.</li>
          <li><strong>Cumprir obrigações legais</strong>, como guardar registros de pagamento.</li>
        </ul>
        <p>Não vendemos dados pessoais e não usamos os dados do seu estoque para nenhuma outra finalidade.</p>
      </Secao>

      <Secao titulo="4. Com quem compartilhamos">
        <p>Só com os serviços necessários para o Estoquizen funcionar, cada um no limite da sua função:</p>
        <ul>
          <li><strong>Supabase</strong>: banco de dados e login (servidores nos Estados Unidos).</li>
          <li><strong>Railway</strong>: servidor da aplicação (Estados Unidos).</li>
          <li><strong>Vercel</strong>: hospedagem do site.</li>
          <li><strong>Stripe</strong>: pagamentos.</li>
          <li><strong>Resend</strong>: envio de e-mails.</li>
          <li><strong>PostHog</strong>: estatísticas de uso do app, só se você aceitar os cookies de análise (Estados Unidos).</li>
          <li><strong>Google</strong>: só se você entrar com a conta Google.</li>
          <li><strong>Open Food Facts</strong>: quando você cadastra pelo código de barras, enviamos só o código para buscar o nome e a foto da embalagem.</li>
          <li><strong>Portais das Secretarias da Fazenda</strong>: para ler uma nota de compra pela chave de acesso, consultamos o portal público da nota.</li>
          <li><strong>Autoridades</strong>, quando a lei exigir.</li>
        </ul>
        <p>
          Alguns desses serviços ficam fora do Brasil, principalmente nos Estados Unidos. Essa transferência acontece para prestar o
          serviço que você contratou, com provedores que adotam medidas de segurança e proteção de dados compatíveis com a LGPD.
        </p>
      </Secao>

      <Secao titulo="5. Por quanto tempo guardamos">
        <ul>
          <li><strong>Dados da empresa e do estoque:</strong> enquanto a assinatura estiver ativa. Quando ela termina (teste vencido sem assinatura ou cancelamento), os dados ficam guardados por 30 dias para você voltar ou exportar, com avisos por e-mail, e depois são excluídos de forma definitiva.</li>
          <li><strong>Conta:</strong> enquanto você a mantiver. Você pode pedir a exclusão a qualquer momento.</li>
          <li><strong>Controle do teste grátis</strong> (CPF codificado): guardado mesmo depois da exclusão da conta, só para impedir testes repetidos.</li>
          <li><strong>Pagamentos e registros exigidos por lei:</strong> pelo prazo que a lei determinar.</li>
          <li><strong>Motivos de cancelamento:</strong> podem ficar guardados sem ligação com a empresa, só para estatística.</li>
        </ul>
      </Secao>

      <Secao titulo="6. Seus direitos">
        <p>Pela LGPD, você pode pedir a qualquer momento:</p>
        <ul>
          <li>a confirmação de que tratamos seus dados e o acesso a eles;</li>
          <li>a correção de dados incompletos ou errados;</li>
          <li>a anonimização, o bloqueio ou a eliminação de dados desnecessários;</li>
          <li>a portabilidade dos dados e a eliminação dos dados tratados com o seu consentimento;</li>
          <li>a informação de com quem compartilhamos seus dados;</li>
          <li>a revogação do consentimento, quando ele for a base do tratamento.</li>
        </ul>
        <p>
          Boa parte você faz no próprio app: corrigir nome, telefone, foto e e-mail no Perfil, exportar produtos e movimentações em
          planilha e excluir a empresa em Configurações. Para o resto, escreva para <a href={`mailto:${contato}`}>{contato}</a>: respondemos
          em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </Secao>

      <Secao titulo="7. Cookies" id="cookies">
        <ul>
          <li><strong>Necessários:</strong> mantêm você conectado, guardam a empresa escolhida e as suas preferências (inclusive a resposta sobre cookies). Sem eles o app não funciona, por isso não pedem permissão.</li>
          <li><strong>De análise (PostHog):</strong> só depois que você clica em &quot;Aceitar&quot; no aviso de cookies. Mostram como o app é usado, sem gravar a tela, para sabermos o que melhorar.</li>
          <li><strong>Pagamento (Stripe):</strong> o formulário do Stripe só é carregado quando você abre o pagamento, e usa cookies próprios para evitar fraude.</li>
        </ul>
        <p>Não usamos cookies de publicidade. Você muda a sua escolha quando quiser em &quot;Preferências de cookies&quot;, no fim desta página, no rodapé do site ou no Perfil.</p>
      </Secao>

      <Secao titulo="8. Segurança">
        <p>
          A conexão é criptografada (HTTPS), as senhas são guardadas de forma irreversível, cada empresa só acessa os próprios dados,
          as permissões seguem o papel de cada pessoa na equipe e os dados de cartão ficam só no Stripe. Nenhum sistema é totalmente
          seguro: se acontecer um incidente que traga risco a você, avisamos você e a ANPD, como a lei manda.
        </p>
      </Secao>

      <Secao titulo="9. Equipe">
        <p>
          O dono de cada empresa decide quem entra na equipe e com qual papel. As movimentações mostram quem as registrou, para
          a própria empresa acompanhar o estoque.
        </p>
      </Secao>

      <Secao titulo="10. Menores de idade">
        <p>O Estoquizen é feito para empresas e para pessoas maiores de 18 anos.</p>
      </Secao>

      <Secao titulo="11. Mudanças nesta política">
        <p>
          Quando houver mudança relevante, avisamos por e-mail ou no app antes de ela valer. Veja também os{" "}
          <Link href="/termos">Termos de Uso</Link>.
        </p>
      </Secao>
    </PaginaLegal>
  );
}
