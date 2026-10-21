import { metadadosDaPagina } from "@/lib/site";

/* Só os metadados (EQZ-47): a página é "use client" e não pode exportar metadata */
export const metadata = metadadosDaPagina("Entrar", "Entre no Estoquizen para controlar o estoque do seu negócio pelo celular ou pelo computador.", "/login");

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
