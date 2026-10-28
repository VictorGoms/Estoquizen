import { metadadosDaPagina } from "@/lib/site";
import { GRATIS_ATE } from "@/lib/teste";

/* Só os metadados (EQZ-47): a página é "use client" e não pode exportar metadata */
export const metadata = metadadosDaPagina(
  "Criar conta grátis",
  `Crie sua conta no Estoquizen e use o controle de estoque de graça até ${GRATIS_ATE}, sem cartão.`,
  "/register",
);

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
