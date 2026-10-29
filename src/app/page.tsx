import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import Benefits from "@/components/Benefits";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import Faq from "@/components/Faq";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { PLANOS, precoEmNumero } from "@/lib/planos";
import type { Metadata } from "next";
import { SITE_URL, SITE_NOME, CONTATO, TITULO_PADRAO, DESCRICAO_PADRAO, REDES_SOCIAIS } from "@/lib/site";

/* O openGraph da página substitui o do layout inteiro, por isso repete tudo */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "pt_BR", siteName: SITE_NOME, title: TITULO_PADRAO, description: DESCRICAO_PADRAO, url: "/" },
};

/* Dados estruturados (EQZ-47): quem faz e o que é vendido, com os preços dos planos. Sem nota nem
   avaliação: só entra quando houver avaliação de cliente real. O WebSite (2026-10-23) dá ao Google o
   nome do site ("Estoquizen" em vez de "estoquizen.com.br" no resultado) e reforça a marca, que ele
   ainda corrige para "estoque" */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#site`,
      name: SITE_NOME,
      url: `${SITE_URL}/`,
      inLanguage: "pt-BR",
      publisher: { "@id": `${SITE_URL}/#organizacao` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organizacao`,
      name: SITE_NOME,
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/apple-icon.png`,
      sameAs: REDES_SOCIAIS,
      email: CONTATO,
      contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: CONTATO, availableLanguage: "Portuguese" },
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NOME,
      url: `${SITE_URL}/`,
      description: DESCRICAO_PADRAO,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web (navegador do celular ou do computador)",
      inLanguage: "pt-BR",
      publisher: { "@id": `${SITE_URL}/#organizacao` },
      offers: PLANOS.map((p) => ({
        "@type": "Offer",
        name: `Plano ${p.name}`,
        price: precoEmNumero(p.price).toFixed(2),
        priceCurrency: "BRL",
        url: `${SITE_URL}/register`,
      })),
    },
  ],
};

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Problem />
        <Benefits />
        <HowItWorks />
        <Pricing />
        <Faq />
        <CTA />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
