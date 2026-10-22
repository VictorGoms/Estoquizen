import type { Metadata } from "next";
import { TESTE_GRATIS } from "@/lib/teste";

/*
 * Dados do site num lugar só (EQZ-47): endereço oficial, contato e prazo de resposta. Usados nos
 * metadados (Google, WhatsApp), no robots/sitemap, no llms.txt, no rodapé e nas páginas legais.
 * O domínio sem "www" redireciona para este.
 */
export const SITE_URL  = "https://www.estoquizen.com.br";
export const SITE_NOME = "Estoquizen";
export const CONTATO   = "contato@estoquizen.com.br";
/** Prazo de resposta do contato (decisão do João em 2026-10-21) */
export const PRAZO_RESPOSTA = "1 dia útil";

export const TITULO_PADRAO    = "Estoquizen — Controle de estoque simples e inteligente";
export const DESCRICAO_PADRAO =
  `App de controle de estoque para pequenos negócios: lê o código de barras pela câmera, dá entrada pela nota de compra e avisa quando um produto chega ao mínimo. ${TESTE_GRATIS}, sem cartão.`;

/* Card do WhatsApp/redes (app/opengraph-image.tsx). Página com openGraph próprio perde a imagem
   herdada do layout, por isso ela vai explícita aqui */
const IMAGEM = { url: "/opengraph-image", width: 1200, height: 630, alt: "Estoquizen: controle seu estoque de forma simples e inteligente" };

/** Metadados de uma página pública: título, descrição, endereço canônico e o card do WhatsApp */
export function metadadosDaPagina(titulo: string, descricao: string, caminho: string): Metadata {
  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: caminho },
    openGraph: { type: "website", locale: "pt_BR", siteName: SITE_NOME, title: `${titulo} · ${SITE_NOME}`, description: descricao, url: caminho, images: [IMAGEM] },
    twitter: { card: "summary_large_image", images: [IMAGEM.url] },
  };
}
