import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import { SearchIcon } from "@/components/ui/icons";
import { CONTATO } from "@/lib/site";

/* Página 404 (EQZ-47): link quebrado ou endereço digitado errado. Aparece também para quem não entrou,
   porque endereço desconhecido não passa pelo SessionGuard (lib/rotas.ts) */
export const metadata = { title: "Página não encontrada" };

export default function NotFound() {
  return (
    <AuthLayout
      icon={<SearchIcon className="w-7 h-7" />}
      title="Página não encontrada"
      subtitle="O endereço pode ter mudado ou estar com um erro de digitação."
    >
      <div className="flex flex-col gap-3">
        <Link
          href="/select-workspace"
          className="min-h-[52px] rounded-full bg-accent text-ink text-[15px] font-black flex items-center justify-center hover:brightness-110 transition-[filter]"
        >
          Abrir o app
        </Link>
        <Link
          href="/"
          className="min-h-[52px] rounded-full bg-surface-2 text-[15px] font-extrabold flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          Ir para a página inicial
        </Link>
        <p className="mt-2 text-center text-[13px] font-bold text-fg-muted">
          Chegou aqui por um link nosso? Avise em{" "}
          <a href={`mailto:${CONTATO}`} className="text-accent underline-offset-2 hover:underline">{CONTATO}</a>.
        </p>
      </div>
    </AuthLayout>
  );
}
