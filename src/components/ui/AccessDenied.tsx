"use client";

import { useRouter } from "next/navigation";

export default function AccessDenied() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.25)" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <div>
        <p className="text-white font-semibold text-lg">Acesso restrito</p>
        <p className="text-slate-500 text-sm mt-1">Você não tem permissão para acessar esta página.</p>
      </div>
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors duration-200 cursor-pointer mt-1"
      >
        Voltar ao início
      </button>
    </div>
  );
}
