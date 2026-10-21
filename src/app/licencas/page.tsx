import Link from "next/link";
import Logo from "@/components/Logo";
import { metadadosDaPagina } from "@/lib/site";

export const metadata = metadadosDaPagina("Licenças", "Conteúdo de terceiros usado no Estoquizen: ícones Fluent Emoji (MIT) e fotos do Open Food Facts.", "/licencas");

/* Créditos de conteúdo de terceiros usado no app (EQZ-30): os ícones dos produtos (Fluent Emoji,
   MIT, que pede o aviso de licença junto) e as fotos de embalagem do Open Food Facts (CC BY-SA). */
const MIT = `MIT License

Copyright (c) Microsoft Corporation.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

export default function LicencasPage() {
  return (
    <div className="min-h-screen bg-ink px-4 py-10">
      <main className="max-w-2xl mx-auto flex flex-col gap-6">
        <Link href="/" className="flex items-center gap-2.5 w-fit" aria-label="Estoquizen — página inicial">
          <Logo size={30} />
          <span className="text-lg font-black">Estoquizen</span>
        </Link>

        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight leading-tight">Licenças</h1>
          <p className="text-[15px] font-bold text-fg-muted">Conteúdo de terceiros usado no Estoquizen.</p>
        </div>

        <section aria-labelledby="lic-icones" className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-3">
          <h2 id="lic-icones" className="text-lg font-black">Ícones dos produtos</h2>
          <p className="text-[15px] font-semibold text-fg-muted leading-relaxed">
            Os ícones que aparecem nos produtos sem foto são do{" "}
            <a href="https://github.com/microsoft/fluentui-emoji" className="text-accent underline underline-offset-2" rel="noopener noreferrer" target="_blank">
              Fluent Emoji
            </a>
            , da Microsoft, usados sob a licença MIT abaixo.
          </p>
          <pre className="text-[12px] leading-relaxed text-fg-soft bg-ink rounded-3xl p-4 whitespace-pre-wrap break-words font-mono">{MIT}</pre>
        </section>

        <section aria-labelledby="lic-off" className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-3">
          <h2 id="lic-off" className="text-lg font-black">Nomes e fotos de embalagem</h2>
          <p className="text-[15px] font-semibold text-fg-muted leading-relaxed">
            Ao cadastrar pelo código de barras, o nome e a foto da embalagem podem vir do{" "}
            <a href="https://world.openfoodfacts.org" className="text-accent underline underline-offset-2" rel="noopener noreferrer" target="_blank">
              Open Food Facts
            </a>
            , um banco de dados aberto feito por colaboradores. Os dados são publicados sob a Open Database License (ODbL) e as
            fotos sob a licença Creative Commons Atribuição-CompartilhaIgual (CC BY-SA). Detalhes nos{" "}
            <a href="https://world.openfoodfacts.org/terms-of-use" className="text-accent underline underline-offset-2" rel="noopener noreferrer" target="_blank">
              termos de uso do Open Food Facts
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
