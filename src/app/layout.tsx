import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import SessionGuardWrapper from "@/components/SessionGuardWrapper";
import { SITE_URL, SITE_NOME, TITULO_PADRAO, DESCRICAO_PADRAO } from "@/lib/site";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

/* Metadados do site (EQZ-47). Página pública com título próprio usa metadadosDaPagina (lib/site.ts),
   que também põe o endereço canônico. A imagem do WhatsApp/redes vem do opengraph-image.tsx */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITULO_PADRAO, template: `%s · ${SITE_NOME}` },
  description: DESCRICAO_PADRAO,
  applicationName: SITE_NOME,
  keywords: ["controle de estoque", "app de estoque", "estoque no celular", "leitor de código de barras", "estoque para pequenos negócios"],
  openGraph: { type: "website", locale: "pt_BR", siteName: SITE_NOME, title: TITULO_PADRAO, description: DESCRICAO_PADRAO },
  twitter: { card: "summary_large_image" },
};

/* Tema escuro nativo (select, barras de rolagem) e área segura do iPhone para o menu inferior */
export const viewport: Viewport = {
  themeColor: "#0b1220",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`scroll-smooth ${nunito.variable}`} data-scroll-behavior="smooth">
      <body className="bg-ink text-fg font-sans antialiased">
        <SessionGuardWrapper>{children}</SessionGuardWrapper>
      </body>
    </html>
  );
}
