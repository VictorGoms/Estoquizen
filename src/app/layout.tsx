import type { Metadata } from "next";
import "./globals.css";
import SessionGuardWrapper from "@/components/SessionGuardWrapper";

export const metadata: Metadata = {
  title: "Estoquizen — Controle de estoque simples e inteligente",
  description:
    "Pare de usar planilhas. Gerencie seu estoque com precisão, alertas inteligentes e visão em tempo real do seu negócio.",
  keywords: ["controle de estoque", "gestão de estoque", "saas estoque", "stock precision"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-navy-900 text-white antialiased">
        <SessionGuardWrapper>{children}</SessionGuardWrapper>
      </body>
    </html>
  );
}
