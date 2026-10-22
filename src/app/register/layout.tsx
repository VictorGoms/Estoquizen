import { metadadosDaPagina } from "@/lib/site";
import { TESTE_GRATIS } from "@/lib/teste";

/* Só os metadados (EQZ-47): a página é "use client" e não pode exportar metadata */
export const metadata = metadadosDaPagina(
  "Criar conta grátis",
  `Crie sua conta no Estoquizen e teste o controle de estoque por ${TESTE_GRATIS}, sem cartão.`,
  "/register",
);

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
