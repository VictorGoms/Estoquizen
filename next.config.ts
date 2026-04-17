import type { NextConfig } from "next";

const securityHeaders = [
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

  // Proxy: frontend fala com o backend via rewrite (evita CORS e mixed-content)
  // Em produção, API_URL aponta para o Railway. Em dev, usa localhost.
  async rewrites() {
    const apiUrl = process.env.API_URL ?? "http://localhost:3001";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiUrl}/api/v1/:path*`,
      },
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
