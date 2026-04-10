# Estoquizen — Frontend (Web)

## Stack
- Framework: Next.js 16 (App Router, `"use client"` onde necessário)
- Estilo: TailwindCSS v3 (config customizado em `tailwind.config.ts`)
- Linguagem: TypeScript strict
- Auth / DB: Supabase (`@supabase/supabase-js`)
- Scanner: `@zxing/browser` + `@zxing/library`

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
- Sidebar fixa: `w-60` (`lg:flex`), offset via `lg:pl-60` no main e `lg:left-60` no topbar
- Conteúdo: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Mobile-first: grid e layout mudam em `sm:`, `md:`, `lg:`
- BottomNav: só mobile (`md:hidden`)

## Identidade visual (tailwind.config.ts)
- Fundo: `bg-navy-900` (`#0f172a`)
- Cards: `rgba(22,32,52,0.8)` + `border: 1px solid rgba(255,255,255,0.08)`
- Accent: brand blue (`#2563EB` = `brand-600`, `#60A5FA` = `brand-400`, `#93C5FD` = `brand-300`)
- Fonte: Manrope → `font-display` | Inter → `font-sans`
- Bordas: `rounded-2xl` padrão
- Utilitários: `bg-hero-gradient`, `bg-card-gradient`, `bg-btn-gradient`
- Sombras: `shadow-card`, `shadow-btn`, `shadow-btn-hover`, `shadow-glass`
- Animações: `animate-fade-up`, `animate-fade-in`, `animate-pulse-slow`

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
| canEncerrarAssinatura   | ✓     | ✗     | ✗      |
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
- `/estoque/item`        — Detalhe do produto
- `/nota`                — Input de NF-e
- `/nota/revisao`        — Revisão da NF-e
- `/membros`             — Lista de membros
- `/membros/[id]`        — Edição de membro
- `/membros/novo`        — Convidar membro
- `/scanner`             — Leitor de código de barras (câmera)
- `/configuracoes`       — Configurações do workspace
- `/notificacoes`        — Notificações
- `/perfil`              — Perfil do usuário

## Estrutura de componentes (`src/components/`)
```
components/
  # Landing page
  Header.tsx / Footer.tsx / Hero.tsx / Benefits.tsx / CTA.tsx / HowItWorks.tsx / DashboardMock.tsx / Logo.tsx

  # Sessão
  SessionGuard.tsx          — verifica sessão + inatividade, redireciona para /login
  SessionGuardWrapper.tsx   — wrapper client para usar SessionGuard no layout.tsx

  auth/
    AuthLayout.tsx / Divider.tsx / InputField.tsx / PasswordField.tsx / PrimaryButton.tsx / SocialButton.tsx

  dashboard/
    DashboardSidebar.tsx / DashboardTopBar.tsx / BottomNav.tsx
    ActionCard.tsx / StatCard.tsx / InfoBanner.tsx

  nota/
    AccessKeyInput.tsx / HelpSection.tsx / NotaTopBar.tsx
    ProductReviewCard.tsx / QRScannerCard.tsx / ReviewSummary.tsx / VerticalDivider.tsx

  onboarding/
    OnboardingShell.tsx / PlanCard.tsx / StepIndicator.tsx

  workspace/
    LayoutContainer.tsx / SecondaryButton.tsx / TopBar.tsx / WorkspaceCard.tsx

  ui/
    AccessDenied.tsx / BarcodeScanner.tsx / PageError.tsx / PageLoader.tsx
```

## Utilitários (`src/lib/`)
- **`supabase.ts`** — singleton `supabase` criado a partir das env vars
- **`api.ts`** — cliente HTTP (`api.get/post/patch/delete`); injeta Bearer token do Supabase automaticamente; base URL via `NEXT_PUBLIC_API_URL`
- **`session.ts`** — gestão de sessão em duas camadas: `sessionStorage` (fecha ao fechar o browser) + `localStorage` para inatividade (timeout: 2h); funções: `markSessionActive`, `isBrowserSessionActive`, `isActivityValid`, `touchActivity`, `clearSession`
- **`sanitize.ts`** — sanitização de inputs: `sanitizeText`, `sanitizeEmail`, `sanitizeNumber`, `sanitizeCode`

## Hooks (`src/hooks/`)
- **`useRole.ts`** — lê role do workspace ativo do localStorage; exporta `useRole()`, `can(role, permission)` e `PERMISSIONS`
- **`useWorkspace.ts`** — lê/grava workspace ativo no localStorage (chave `estoquizen_workspace`); exporta `getWorkspace`, `setWorkspace`, `clearWorkspace`; tipo `ActiveWorkspace { id, name, role }`
- **`useAlertCount.ts`** — conta produtos com `qty === 0` ou `qty <= min_qty` via Supabase; atualiza a cada 60s

## Segurança (next.config.ts)
Headers HTTP globais aplicados em todas as rotas:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=*, geolocation=(), microphone=()`
