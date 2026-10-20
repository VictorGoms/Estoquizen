# Estoquizen — Frontend (Web)

## Stack
- Framework: Next.js 16 (App Router, `"use client"` onde necessário) + React 19 (o `react-is` do Recharts é forçado na mesma versão pelo `overrides` do package.json)
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
| canAddMembro            | ✓     | ✓     | ✗      |
| canEditMembro           | ✓     | ✓     | ✗      |
| canEditOwnerRole        | ✓     | ✗     | ✗      |

## Navegação implementada
- `/`                    — Landing page
- `/login`               — Auth
- `/register`            — Cadastro
- `/auth/callback`       — Callback OAuth do Supabase
- `/select-workspace`    — Seleção de workspace
- `/register-company`    — Onboarding empresa
- `/plan-selection`      — Escolha de plano
- `/dashboard`           — Home do workspace
- `/dashboard-metricas`  — Métricas
- `/estoque`             — Lista de produtos
- `/estoque/[id]`        — Detalhe do produto (com histórico)
- `/estoque/novo`        — Cadastro de produto
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
- `/contagem`            — Contagem do dia (Growth/Pro; owner/admin): 5 itens escolhidos pela curva ABC, contagem às cegas, confiabilidade e sequência
- `/compras`             — Lista de compras (no mínimo ou acabando em 7 dias, quantidade sugerida, compartilhar pelo WhatsApp)
- `/perfil`              — Perfil do usuário

## Estrutura de componentes (`src/components/`)
```
components/
  # Landing page
  Header.tsx / Footer.tsx / Hero.tsx / Problem.tsx / Benefits.tsx / HowItWorks.tsx / Pricing.tsx / Faq.tsx / CTA.tsx / DashboardMock.tsx / Logo.tsx
  # Ordem: Hero → Problem (dor + frase de posicionamento) → Benefits → HowItWorks → Pricing (#precos) → Faq (#perguntas, com JSON-LD FAQPage) → CTA
  # Sem depoimentos inventados: prova social só com cliente real

  # Sessão
  SessionGuard.tsx          — verifica sessão + inatividade, redireciona para /login
  SessionGuardWrapper.tsx   — wrapper client para usar SessionGuard no layout.tsx

  auth/
    AuthLayout.tsx / Divider.tsx / InputField.tsx / PasswordField.tsx / PrimaryButton.tsx / SocialButton.tsx

  dashboard/
    DashboardSidebar.tsx / DashboardTopBar.tsx / BottomNav.tsx / TrialBanner.tsx

  estoque/
    StatusChip.tsx / ProductAvatar.tsx / LevelBar.tsx / MovementForm.tsx / MovementSheet.tsx / ProductPanel.tsx

  nota/
    ProductReviewCard.tsx   — linha de produto da revisão (status, quantidade editável, remover)

  onboarding/
    OnboardingShell.tsx / PlanCard.tsx / StepIndicator.tsx

  workspace/
    LayoutContainer.tsx / SecondaryButton.tsx / TopBar.tsx / WorkspaceCard.tsx

  ui/
    AccessDenied.tsx / BarcodeScanner.tsx / PageError.tsx / PageLoader.tsx / FormField.tsx / icons.tsx
```

## Utilitários (`src/lib/`)
- **`supabase.ts`** — singleton `supabase` criado a partir das env vars
- **`api.ts`** — cliente HTTP (`api.get/post/patch/delete`); injeta Bearer token do Supabase automaticamente; base URL via `NEXT_PUBLIC_API_URL`
- **`session.ts`** — gestão de sessão em duas camadas: `sessionStorage` (fecha ao fechar o browser) + `localStorage` para inatividade (timeout: 2h); funções: `markSessionActive`, `isBrowserSessionActive`, `isActivityValid`, `touchActivity`, `clearSession`
- **`sanitize.ts`** — sanitização de inputs: `sanitizeText`, `sanitizeEmail`, `sanitizeNumber`, `sanitizeCode`
- **`dbMessages.ts`** — `dbErrorPt(err, fallback)`: erro das escritas diretas no Supabase em português (as mensagens das triggers passam como estão)
- **`nfe.ts`** — dígito verificador da chave, GTIN e código do item "SEM GTIN" (espelho do `nfeChave.ts` da API)
- **`planos.ts`** — `PLANOS`: preços e recursos de cada plano, usados na escolha de plano e nos preços da landing (um lugar só). Preços da EQZ-11 (24,90 / 39,90 / 59,90) desde 2026-10-20
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
- **`useProducts.ts`** — lista de produtos paginada de 1000 em 1000; `mutateProducts` também invalida a contagem e a previsão

## Segurança (next.config.ts)
Headers HTTP globais aplicados em todas as rotas:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=*, geolocation=(), microphone=()`
