import Link from "next/link";

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="w-16 h-16 rounded-full bg-surface text-zero flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-black">Acesso restrito</h1>
        <p className="text-[15px] font-bold text-fg-muted">Seu papel neste workspace não permite abrir esta página.</p>
      </div>
      <Link href="/dashboard" className="min-h-[48px] flex items-center px-6 rounded-full bg-accent text-ink text-[15px] font-black hover:brightness-110 transition-[filter]">
        Voltar ao início
      </Link>
    </div>
  );
}
