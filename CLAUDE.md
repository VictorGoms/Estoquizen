# Estoquizen — Frontend (Web)

## Stack
- Framework: Next.js 16 (App Router, `"use client"` onde necessário) + React 19 (o `react-is` do Recharts é forçado na mesma versão pelo `overrides` do package.json)
- Testes: `npm test` (Vitest, `src/lib/*.test.ts`: estoque, planilha, nota, ícones, ramos). A CI do GitHub (`.github/workflows/ci.yml`) roda tipos, lint e testes em cada push; o build continua na Vercel. Mexeu numa regra de `src/lib`? Atualize ou crie o teste
- Lint: `npm run lint` (ESLint 9, `eslint.config.mjs` com as regras do Next 16). `react-hooks/set-state-in-effect` fica como aviso, porque ler `Date.now()`/`localStorage`/`window` num `useEffect` é o padrão do projeto (ver "Regras críticas de React")
- Estilo: TailwindCSS v4. O tema fica no bloco `@theme` de `src/app/globals.css` (não existe mais `tailwind.config.ts`); lá também ficam os padrões do v3 mantidos de propósito (cor de borda e de placeholder, cursor dos botões, altura de linha fixa dos `text-*`)
- Linguagem: TypeScript strict
- Auth / DB: Supabase (`@supabase/supabase-js`)
- Scanner: `@zxing/browser` + `@zxing/library`
- Excel: `read-excel-file` (fixo em 9.3.10), carregado sob demanda só na importação de planilha

## Variáveis de ambiente necessárias
Criar `.env.local` na raiz com:
```
NEXT_PUBLIC_SUPABASE_URL=<sua-url-supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key>
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1   # opcional, este é o padrão
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...     # chave PÚBLICA do Stripe; com ela o pagamento abre dentro do app
NEXT_PUBLIC_POSTHOG_KEY=phc_...                    # opcional: analytics (EQZ-01). Sem ela, nada de analytics nem aviso de cookies (o normal em dev)
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com  # região do projeto no PostHog; destino do proxy /ingest
```

## Dev local (HTTPS)
O projeto roda em HTTPS com certificado local via `mkcert` (pasta `certs/`):
```bash
npm run dev   # usa --experimental-https com cert/key em ./certs/
```
- Frontend: `https://localhost:3000`
- API backend (Fastify): `http://localhost:3001` (pasta `../EstoquizenAPI`)
- Acesso pelo celular na mesma rede: `192.168.0.6` está na `allowedDevOrigins`
- `reactStrictMode: false` — evita double-mount que inicializa a câmera duas vezes

## Proxy (next.config.ts)
Requisições `/api/v1/*` são proxiadas pelo Next.js para `http://localhost:3001/api/v1/*`,
permitindo que o celular (HTTPS) alcance o Fastify (HTTP) sem mixed-content errors.
`/ingest/*` vai para o PostHog (`NEXT_PUBLIC_POSTHOG_HOST` e o `-assets` dele), para bloqueador de anúncio não cortar o analytics; por isso `skipTrailingSlashRedirect: true`.

## Regras de layout
- Sidebar fixa: `w-64` (`lg:flex`), painel flutuante arredondado; offset via `lg:pl-64` no main e `lg:left-64` no topbar
- Conteúdo: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Mobile-first: grid e layout mudam em `sm:`, `md:`, `lg:`
- BottomNav: flutuante, abaixo de `lg` (`lg:hidden`); páginas com ela usam `pb-28 lg:pb-16`. Itens: Início · Estoque · Escanear (central) · Métricas · Equipe. Configurações fica no Perfil (celular) e no menu lateral.
- Estoque no computador: lista + painel de detalhe (`ProductPanel`) lado a lado; no celular, toque abre `/estoque/[id]` e o botão ± abre `MovementSheet`.

## Identidade visual — tema "Noite Azul" (`@theme` em globals.css)
- Prévia e guia visual aprovados em 2026-10-16 (canvas de design fora do repositório)
- Tokens: `bg-ink` (#0b1220, fundo) · `bg-panel` (menu lateral) · `bg-surface` / `bg-surface-2` (cards / elementos internos) · `text-fg`, `text-fg-soft`, `text-fg-muted`, `text-fg-subtle`
- Destaque: `bg-accent` (#60a5fa = `brand-400`) com texto `text-ink` — card de resumo, botão principal, item ativo de segmentado
- Card claro invertido: `bg-inverse` + `text-ink` (`text-inverse-muted` para secundário) — item ativo do menu, produto selecionado, ação principal (Escanear)
- Status: `ok` (normal), `low` (baixo), `zero` (zerado) — sempre com rótulo (`StatusChip`), nunca só cor
- Fonte: Nunito via `next/font` (variável `--font-nunito`) em `font-sans` e `font-display`; pesos 800/900 para títulos e números
- Formas: cards `rounded-4xl`/`rounded-5xl`/`rounded-6xl`, botões e filtros em pílula (`rounded-full`), divisórias `border-t-2 border-dashed`
- Toque: alvos ≥ 44px; foco global via `:focus-visible` (globals.css); `prefers-reduced-motion` respeitado
- Ícones: `src/components/ui/icons.tsx` · Regras/formatação de estoque: `src/lib/stock.ts` (deriveStatus, formatQty, formatBRL, stockLevel, timeAgo)
- Componentes de estoque: `src/components/estoque/` (StatusChip, ProductAvatar, LevelBar, MovementForm, MovementSheet, ProductPanel)
- Formulários: `src/components/ui/FormField.tsx` (rótulo ligado ao campo via `htmlFor` + `inputClass` padrão)
- Todas as páginas estão no tema (landing, auth, onboarding, telas internas e nota) desde 2026-10-16
- Gráfico de Métricas usa Recharts com as cores do tema em hex (`#60a5fa` entradas, `#eef3fb` saídas), sem degradê
- Os utilitários do tema antigo (`bg-*-gradient`, `shadow-card/btn`, `.btn-primary`, `.glass-card`) foram removidos: não recriar

## Escritas no banco (SCRUM-48)
- Toda escrita passa pela API (`src/lib/api.ts`). O banco não aceita mais escrita direta de produto, estoque, movimentação, workspace e membro (só por GRANT/policy limitados)
- Exceções que seguem direto no Supabase: o próprio perfil (nome, telefone, foto), recusar o próprio convite e upload de fotos no storage
- Foto de produto vai em `product-images/<workspace_id>/...`: o storage recusa outra pasta

## Regras críticas de React
- NÃO usar `Date.now()`, `Math.random()` ou `window` diretamente no render
- Lógica dependente de horário/browser → `useEffect` + `useState` com valor inicial estável

## Personas (roles)
Apenas 3: `owner`, `admin`, `member`

### Tabela de permissões (`src/hooks/useRole.ts`)
| Permissão               | owner | admin | member |
|-------------------------|-------|-------|--------|
| canAccessNota           | ✓     | ✓     | ✗      |
| canAccessConfiguracoes  | ✓     | ✓     | ✗      |
| canGerenciarAssinatura  | ✓     | ✗     | ✗      |
| canExcluirWorkspace     | ✓     | ✗     | ✗      |
| canEditEstoque          | ✓     | ✓     | ✗      |
| canMovimentar           | ✓     | ✓     | ✓      |
| canAddMembro            | ✓     | ✓     | ✗      |
| canEditMembro           | ✓     | ✓     | ✗      |
| canEditOwnerRole        | ✓     | ✗     | ✗      |

`canMovimentar` (SCRUM-62, 2026-10-20): entrada, saída (scanner, botão ±, painel e tela do produto) e contagem do dia, para todos os papéis. `canEditEstoque` é cadastrar, editar, excluir e importar produto (planilha e nota): a API e as policies do banco também recusam o membro.

## Navegação implementada
- `/`                    — Landing page
- `/login`               — Auth
- `/register`            — Cadastro
- `/auth/callback`       — Callback OAuth do Supabase
- `/select-workspace`    — Seleção de workspace
- `/register-company`    — Onboarding empresa, com "Qual é o seu negócio?" (EQZ-13; obrigatório, "Outro" com texto) guardado no sessionStorage e mandado no `POST /workspaces` pela escolha de plano
- `/plan-selection`      — Escolha de plano
- `/dashboard`           — Home do workspace
- `/dashboard-metricas`  — Métricas
- `/estoque`             — Lista de produtos
- `/estoque/[id]`        — Detalhe do produto (com histórico)
- `/estoque/novo`        — Cadastro de produto (owner/admin)
- `/estoque/modelo`      — Lista pronta do ramo (EQZ-13, owner/admin): os itens comuns do segmento com mínimo sugerido e quantidade 0, pela mesma rota da planilha; pula nome que já existe. Quem não tem ramo escolhe ali (e fica gravado). Atalhos no estoque vazio e no menu "+"
- `/estoque/importar`    — Importar planilha (owner/admin): CSV ou Excel (.xlsx), colunas adivinhadas pelo cabeçalho e trocáveis, prévia com erro por linha, pula o que já existe (código ou, sem código, nome) e corta no limite do plano
- `/nota`                — Input de NF-e
- `/nota/revisao`        — Revisão da NF-e
- `/membros`             — Lista de membros
- `/membros/[id]`        — Edição de membro
- `/membros/novo`        — Convidar membro
- `/scanner`             — Leitor de código de barras (câmera)
- `/configuracoes`       — Configurações do workspace
- `/notificacoes`        — Notificações
- `/historico`           — Histórico por funcionário (Pro; owner/admin): movimentações filtradas por pessoa, tipo e período
- `/contagem`            — Contagem do dia (Growth/Pro; todos os papéis desde o SCRUM-62): 5 itens escolhidos pela curva ABC, contagem às cegas, confiabilidade e sequência
- `/compras`             — Lista de compras (no mínimo ou acabando em 7 dias, quantidade sugerida, compartilhar pelo WhatsApp). "Adicionar item" põe qualquer produto à mão (`/shopping-list`, vale para a equipe e sai sozinho quando chega uma entrada do produto); os ajustes dos itens automáticos continuam só neste navegador
- `/licencas`            — Licenças (pública): aviso MIT dos ícones Fluent Emoji e crédito do Open Food Facts (CC BY-SA)
- `/termos` e `/privacidade` — Termos de Uso e Política de Privacidade (públicas, EQZ-10; dados que mudam em `DADOS_LEGAIS` de `components/legal/PaginaLegal.tsx`)
- `not-found.tsx`       — Página 404 em português ("Abrir o app" e "Ir para a página inicial"). Endereço desconhecido não passa pelo SessionGuard, então quem não entrou também vê a 404
- `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/opengraph-image` — gerados no build (EQZ-47): `app/robots.ts` (bloqueia as telas internas), `app/sitemap.ts` (só as públicas), `app/llms.txt/route.ts` (resumo para assistentes de IA, montado de planos, perguntas e ramos) e `app/opengraph-image.tsx` (card do WhatsApp/redes, 1200×630, Nunito do Google Fonts no build)
- `/perfil`              — Perfil do usuário; "E-mail de acesso" troca o e-mail (`updateUser({ email })`, link de confirmação volta em `/perfil?email=confirmado`; conta só do Google não troca)

## Estrutura de componentes (`src/components/`)
```
components/
  # Landing page
  Header.tsx / Footer.tsx / Hero.tsx / Problem.tsx / Benefits.tsx / HowItWorks.tsx / Pricing.tsx / Faq.tsx / CTA.tsx / HeroLoop.tsx (vídeo em loop do hero, arquivos em public/hero/) / Logo.tsx
  # Ordem: Hero → Problem (dor + frase de posicionamento) → Benefits → HowItWorks → Pricing (#precos) → Faq (#perguntas, com JSON-LD FAQPage) → CTA
  # Sem depoimentos inventados: prova social só com cliente real

  # Sessão
  Analytics.tsx             — no layout: aviso de cookies ("Só o necessário" e "Aceitar" com o mesmo peso) e ligação do login com o PostHog (identify/reset). Só aparece com `NEXT_PUBLIC_POSTHOG_KEY`
  BotaoCookies.tsx          — "Preferências de cookies" (reabre o aviso): rodapé, páginas legais e Perfil
  SessionGuard.tsx          — verifica sessão + inatividade, redireciona para /login
  SessionGuardWrapper.tsx   — wrapper client para usar SessionGuard no layout.tsx. Quais telas pedem login fica em `lib/rotas.ts`: **tela nova precisa entrar em `ROTAS_PUBLICAS` ou `ROTAS_INTERNAS`** (o teste `rotas.test.ts` falha se faltar)
  WorkspaceGate.tsx         — workspace com assinatura encerrada (trial_expired, canceled, deleted): as páginas internas viram a tela de bloqueio; ficam abertas /select-workspace, /perfil e /configuracoes. Sem piscar: a escolha de workspace já deixa a assinatura no cache do SWR (`guardarSubscription`) e o último "bloqueado" fica no localStorage (`estoquizen_bloqueado:<id>`), lido num layout effect antes da primeira pintura

  auth/
    AuthLayout.tsx / Divider.tsx / InputField.tsx / PasswordField.tsx / PrimaryButton.tsx / SocialButton.tsx

  dashboard/
    DashboardSidebar.tsx / DashboardTopBar.tsx / BottomNav.tsx / TrialBanner.tsx
    AssinaturaBloqueada.tsx — tela de workspace bloqueado: motivo, até quando os dados ficam (expired_at + 30 dias), assinar de novo (escolha do plano, só owner) e exportar (owner/admin). Variante "Assinatura pausada" (EQZ-07): data da volta e "Retomar agora" (cobra hoje), sem contagem de exclusão

  estoque/
    StatusChip.tsx / ProductAvatar.tsx / LevelBar.tsx / MovementForm.tsx / MovementSheet.tsx / ProductPanel.tsx
    IconPicker.tsx — escolha do ícone do produto (automático, só iniciais ou um dos 231, com busca), na tela do produto
    # ProductAvatar (EQZ-30): foto (da pessoa ou da embalagem do Open Food Facts, mostrada inteira em fundo branco) → ícone escolhido (`products.icon`) → ícone pelo nome → iniciais. Passe `icon={p.icon}` onde houver o produto

  nota/
    ProductReviewCard.tsx   — linha de produto da revisão (status, quantidade editável, remover)

  pagamento/
    PagamentoEmbutido.tsx — pagamento dentro do app (Checkout incorporado do Stripe, 2026-10-21): quadro sobre a página com o formulário do Stripe; depois de pagar espera o webhook ativar o plano. Usado na escolha de plano, na tela de bloqueio, no banner do trial e em Configurações. Troca de plano de quem já paga segue no portal (a API devolve url). Sem `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`lib/pagamento.ts`), tudo vai para a página do Stripe como antes

  compras/
    AdicionarItem.tsx — quadro "Adicionar à lista" da lista de compras: busca nos produtos que ainda não estão nela, quantidade sugerida

  configuracoes/
    Desistencia.tsx — EQZ-50: "Desistir e receber o valor de volta", só nos 7 dias depois do 1º pagamento da assinatura (GET /billing/desistencia diz até quando e quanto); confirma e chama POST /billing/desistir (devolve no cartão e cancela na hora). Não pede motivo. Aparece acima de "Cancelar assinatura", também com cancelamento agendado. Pelo app vale 1 vez por pessoa (decisão do João, 2026-10-23): quando a API devolve `pelo_contato`, mostra o pedido pelo contato@ no lugar do botão
    Cancelamento.tsx — EQZ-07: cancelamento 100% no app (sem o Stripe): 1 pergunta, uma oferta e a confirmação (POST /billing/cancel); depois "Desfazer cancelamento" em Configurações. A oferta (descer para o plano mais barato que caiba ou pausar por 1 ou 2 meses: usa até o fim do mês pago, depois fica bloqueado sem cobrança e volta sozinho); grava em /billing/cancel-feedback. Em Configurações, pausa agendada tem "Desfazer pausa" e a em andamento "Retomar agora"

  onboarding/
    OnboardingShell.tsx / PlanCard.tsx / StepIndicator.tsx

  workspace/
    LayoutContainer.tsx / SecondaryButton.tsx / TopBar.tsx / WorkspaceCard.tsx

  ui/
    AccessDenied.tsx / BarcodeScanner.tsx / PageError.tsx / PageLoader.tsx / FormField.tsx / icons.tsx
```

## Utilitários (`src/lib/`)
- **`site.ts`** — EQZ-47: endereço oficial (`SITE_URL`, com www), `CONTATO`, `PRAZO_RESPOSTA` ("1 dia útil", rodapé e FAQ), título e descrição padrão e `metadadosDaPagina(titulo, descricao, caminho)` para página pública (título, canônico, card do WhatsApp com a imagem). O `openGraph` de uma página substitui o do layout inteiro: use o helper ou repita tudo
- **`rotas.ts`** — telas públicas × internas (`rotaAberta`), usado pelo SessionGuardWrapper e pelo robots
- **`perguntas.ts`** — perguntas frequentes da landing (com JSON-LD FAQPage) e do /llms.txt
- **`llms.ts`** — texto do /llms.txt
- **`analytics.ts`** — EQZ-01, PostHog com consentimento (opção A da LGPD, decisão do João em 2026-10-21): o pacote só é baixado e só grava algo no navegador depois do "Aceitar"; "Só o necessário" depois de aceitar para de contar e apaga os cookies do PostHog (`disable_persistence`). Sem gravação de sessão, `mask_all_text` (clique sem o texto da tela), `limparEvento` no `before_send` (endereço sem #hash e só com os parâmetros de `PARAMS_LIVRES`, porque links de login trazem tokens) e `identify` só com o id do Supabase. `registrar(evento, props)` não faz nada sem aceite
- **`eventos.ts`** — eventos do funil a partir das escritas na API (`api.ts` chama `eventoDaChamada` depois de cada POST que dá certo): `empresa_criada`, `produto_cadastrado`, `produtos_importados`, `nota_importada`, `movimentacao_registrada`, `contagem_feita`, `membro_convidado`, `pagamento_aberto`, `motivo_cancelamento`, `assinatura_cancelada/pausada/retomada` etc. Rota nova que importa para o funil? Ponha aqui (e no teste). Fora daqui: `cadastro_criado` (cadastro e /auth/callback para Google) e `assinou` (PagamentoEmbutido). Nunca mandar nome, e-mail, CPF, nome de produto ou texto digitado
- **`supabase.ts`** — singleton `supabase` criado a partir das env vars
- **`api.ts`** — cliente HTTP (`api.get/post/patch/delete`); injeta Bearer token do Supabase automaticamente; base URL via `NEXT_PUBLIC_API_URL`
- **`session.ts`** — gestão de sessão em duas camadas: `sessionStorage` (fecha ao fechar o browser) + `localStorage` para inatividade (timeout: 2h); funções: `markSessionActive`, `isBrowserSessionActive`, `isActivityValid`, `touchActivity`, `clearSession`
- **`sanitize.ts`** — sanitização de inputs: `sanitizeText`, `sanitizeEmail`, `sanitizeNumber`, `sanitizeCode`
- **`dbMessages.ts`** — `dbErrorPt(err, fallback)`: erro das escritas diretas no Supabase em português (as mensagens das triggers passam como estão)
- **`nfe.ts`** — dígito verificador da chave, GTIN e código do item "SEM GTIN" (espelho do `nfeChave.ts` da API)
- **`codigoBarras.ts`** — EQZ-53: `buscarPorCodigo(ean)` no cadastro de produto. Consulta juntas as 4 bases abertas (Open Food Facts, Open Products Facts, Open Beauty Facts, Open Pet Food Facts; mesma API, CORS liberado) e o catálogo próprio (`GET /catalogo/:codigo` da API, só nome confiável); nome das bases primeiro, depois o do catálogo; foto só dos servidores de imagem das bases (`ehFotoDeBaseAberta`). Devolve a fonte para o aviso "Nome sugerido pelo …"
- **`iconeProduto.ts`** — EQZ-30: 231 ícones Fluent Emoji 3D em `public/icones/produtos/<chave>.webp` (14 grupos; eram 80 até 2026-10-20), dicionário de sinônimos do comércio, palavras do Unicode CLDR em português escolhidas à mão e `iconeDoNome` (expressões → palavras fortes → CLDR → genéricas, com plural); `iconeDoProduto(nome, icon)` respeita a escolha manual (`"nenhum"` = só iniciais); `buscarIcones` alimenta a busca do seletor. Ícone novo: PNG 3D do Fluent convertido para WebP 128 px + entrada em `ICONES` e nos sinônimos (a chave precisa casar com o CHECK `^[a-z]{2,20}$` de `products.icon`). Antes de mexer no dicionário, rodar uma lista de nomes nas versões antiga e nova e comparar
- **`segmentos.ts`** — EQZ-13: os 7 ramos (`workspaces.segment`), com atalhos de unidade (`ordenarUnidades`: só muda a ordem da lista única), termo (insumos × produtos), dica de rotina e a lista pronta. Os nomes dos itens batem com o dicionário de ícones. Ramo também em Configurações
- **`teste.ts`** — teste grátis: `DIAS_TESTE` (30, oferta de lançamento de 2026-10-21 para quem começar até `OFERTA_ATE` = 30/11, todos os planos, Pro incluído) e `TESTE_GRATIS` ("30 dias grátis"). Todo texto do site sobre o teste usa estas constantes. Em 01/12 o João decide se volta para 14: mudar aqui e `src/lib/trial.ts` da API
- **`planos.ts`** — `PLANOS`: preços e recursos de cada plano, usados na escolha de plano e nos preços da landing (um lugar só). Preços da EQZ-11 (24,90 / 39,90 / 59,90) desde 2026-10-20. `precoEmNumero` alimenta o JSON-LD (`SoftwareApplication` com as ofertas, na `app/page.tsx`) e o llms.txt
- **`planilha.ts`** — importação de planilha (EQZ-14): `lerArquivo` (CSV `;`/`,`/tab com UTF-8 ou Windows-1252, ou .xlsx), `adivinharColunas`, `validar` (número em formato brasileiro, código em notação científica, já cadastrado, repetido) e `baixarModelo`
- **`exportCsv.ts`** — `exportProductsCsv` / `exportMovementsCsv`: CSV no formato do Excel em português (`;`, vírgula decimal, BOM), paginado de 1000 em 1000; usado em `/configuracoes#exportar`

## Hooks (`src/hooks/`)
- **`useRole.ts`** — lê role do workspace ativo do localStorage; exporta `useRole()`, `can(role, permission)` e `PERMISSIONS`
- **`useWorkspace.ts`** — lê/grava workspace ativo no localStorage (chave `estoquizen_workspace`); exporta `getWorkspace`, `setWorkspace`, `clearWorkspace`; tipo `ActiveWorkspace { id, name, role }`
- **`useAlertCount.ts`** — conta produtos com `qty === 0` ou `qty <= min_qty` via Supabase; atualiza a cada 60s
- **`usePlan.ts`** — plano do workspace ativo e `PLAN_INFO` (produtos, notas por mês, dias de métricas, membros, próximo plano), espelho do `plans.ts` da API
- **`useProductLimit.ts`** — produtos cadastrados × limite do plano (aviso aos 80% e no limite)
- **`useForecast.ts`** — saídas de 30 dias por produto (RPC `stock_forecast`); a previsão é `previsaoDias`/`consumoDiario` em `lib/stock.ts`
- **`useLastOutflow.ts`** — última saída de cada produto (RPC `stock_last_outflow`); "parado" é `estaParado` em `lib/stock.ts` (estoque > 0, cadastro e última saída há 60+ dias). Growth e Pro
- **`useStockCounts.ts`** — contagens dos últimos 90 dias (tabela `stock_counts`); a escolha do dia, a sequência e a confiabilidade ficam em `lib/contagem.ts`
- **`useSubscription.ts`** — assinatura do workspace pela API (`/billing/subscription`, a tabela não é lida direto); `estaBloqueada` (mesma regra do `workspace_is_writable`, incluindo a pausa em andamento), `guardadoAte` (fim + 30 dias, prazo do job de limpeza)
- **`useProducts.ts`** — lista de produtos paginada de 1000 em 1000; `mutateProducts` também invalida a contagem e a previsão

## Segurança (next.config.ts)
Headers HTTP globais aplicados em todas as rotas:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=*, geolocation=(), microphone=()`
