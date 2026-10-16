import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import SessionGuardWrapper from "@/components/SessionGuardWrapper";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Estoquizen — Controle de estoque simples e inteligente",
  description:
    "Pare de usar planilhas. Gerencie seu estoque com precisão, alertas inteligentes e visão em tempo real do seu negócio.",
  keywords: ["controle de estoque", "gestão de estoque", "saas estoque", "stock precision"],
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
