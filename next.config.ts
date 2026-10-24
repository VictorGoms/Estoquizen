import type { NextConfig } from "next";

/* CSP (EQZ-59, auditoria de 2026-10-23; o Stripe recomenda para o pagamento embutido). Em modo
   Report-Only: o navegador só avisa no console o que bloquearia. Depois de uns dias sem aviso nas
   telas (pagamento, scanner, foto, nota), trocar o header para Content-Security-Policy. */
const STRIPE   = "https://*.stripe.com";
const SUPABASE = "https://*.supabase.co";
const BASES    = ["openfoodfacts", "openproductsfacts", "openbeautyfacts", "openpetfoodfacts"];
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"} https://js.stripe.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${SUPABASE} ${STRIPE} ${BASES.map((b) => `https://images.${b}.org`).join(" ")}`,
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE} wss://*.supabase.co https://api.stripe.com ${STRIPE} ${BASES.map((b) => `https://world.${b}.org`).join(" ")}`,
  `frame-src https://js.stripe.com ${STRIPE}`,
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: csp },
  // Bloqueia carregamento do site em iframes (anti-clickjacking)
  { key: "X-Frame-Options",        value: "DENY" },
  // Impede que o browser tente adivinhar o Content-Type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Ativa filtro XSS legado em browsers antigos
  { key: "X-XSS-Protection",       value: "1; mode=block" },
  // Não vaza a URL completa no Referer para outros domínios
  { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
  // Restringe quais APIs o browser pode usar neste site
  { key: "Permissions-Policy",     value: "camera=*, geolocation=(), microphone=()" },
];

const nextConfig: NextConfig = {
  // Strict Mode causa double-mount em dev, o que faz a câmera inicializar duas vezes
  reactStrictMode: false,

  // Permite acesso pelo IP local (teste no celular na mesma rede Wi-Fi)
  allowedDevOrigins: ["192.168.0.6"],

  // Desde a 16.4 o `next dev` cria um AGENTS.md genérico; o guia do projeto é o CLAUDE.md
  agentRules: false,

  // O PostHog manda alguns pedidos com barra no fim (/ingest/e/); sem isto o Next redireciona e quebra
  skipTrailingSlashRedirect: true,

  // Proxy: frontend fala com o backend via rewrite (evita CORS e mixed-content)
  // Em produção, API_URL aponta para o Railway. Em dev, usa localhost.
  async rewrites() {
    const apiUrl = process.env.API_URL ?? "http://localhost:3001";
    // Analytics (EQZ-01): o PostHog passa pelo próprio domínio em /ingest, senão bloqueador de anúncio corta
    const posthog = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
    const posthogAssets = posthog.replace(".i.posthog.com", "-assets.i.posthog.com");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiUrl}/api/v1/:path*`,
      },
      { source: "/ingest/static/:path*", destination: `${posthogAssets}/static/:path*` },
      { source: "/ingest/array/:path*",  destination: `${posthogAssets}/array/:path*` },
      { source: "/ingest/:path*",        destination: `${posthog}/:path*` },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
