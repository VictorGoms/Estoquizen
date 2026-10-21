import { metadadosDaPagina } from "@/lib/site";

/* Só os metadados (EQZ-47): a página é "use client" e não pode exportar metadata */
export const metadata = metadadosDaPagina(
  "Criar conta grátis",
  "Crie sua conta no Estoquizen e teste o controle de estoque por 14 dias grátis, sem cartão.",
  "/register",
);

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
