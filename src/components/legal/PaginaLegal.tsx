import Link from "next/link";
import Logo from "@/components/Logo";
import { CONTATO } from "@/lib/site";
import BotaoCookies from "@/components/BotaoCookies";

/*
 * Molde das páginas legais (/termos, /privacidade): mesmo visual da /licencas, texto corrido em
 * seções com título. Os dados que mudam (responsável, contato, foro, data) ficam em DADOS_LEGAIS.
 */

export const DADOS_LEGAIS = {
  /* Aprovados pelo João em 2026-10-21. Trocar pela razão social e CNPJ quando houver */
  responsavel: "João Victor da Silva Gomes",
  contato:     CONTATO,
  foro:        "São Paulo/SP",
  atualizado:  "28 de outubro de 2026",
};

export function Secao({ titulo, id, children }: { titulo: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex flex-col gap-2.5 scroll-mt-6">
      <h2 className="text-lg font-black">{titulo}</h2>
      <div className="flex flex-col gap-2.5 text-[15px] font-semibold text-fg-soft leading-relaxed [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5 [&_ul]:list-disc [&_strong]:text-fg [&_strong]:font-extrabold [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </section>
  );
}

export default function PaginaLegal({ titulo, resumo, children }: { titulo: string; resumo: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink px-4 py-10">
      <main className="max-w-2xl mx-auto flex flex-col gap-6">
        <Link href="/" className="flex items-center gap-2.5 w-fit" aria-label="Estoquizen — página inicial">
          <Logo size={30} />
          <span className="text-lg font-black">Estoquizen</span>
        </Link>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight leading-tight">{titulo}</h1>
          <p className="text-[15px] font-bold text-fg-muted">{resumo}</p>
          <p className="text-[13px] font-bold text-fg-subtle">Última atualização: {DADOS_LEGAIS.atualizado}</p>
        </div>

        <article className="bg-surface rounded-5xl p-5 lg:p-7 flex flex-col gap-7">{children}</article>

        <nav aria-label="Outras páginas" className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-extrabold text-fg-muted">
          <Link href="/termos" className="hover:text-fg">Termos de Uso</Link>
          <Link href="/privacidade" className="hover:text-fg">Política de Privacidade</Link>
          <Link href="/licencas" className="hover:text-fg">Licenças</Link>
          <a href={`mailto:${DADOS_LEGAIS.contato}`} className="hover:text-fg">{DADOS_LEGAIS.contato}</a>
          <BotaoCookies className="hover:text-fg" />
        </nav>
      </main>
    </div>
  );
}
