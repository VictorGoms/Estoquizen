import type { ReactNode } from "react";

/** Classe padrão dos campos de texto do tema "Noite Azul" (sobre cards bg-surface). */
export const inputClass =
  "w-full h-12 px-4 rounded-2xl bg-ink text-fg text-[15px] font-semibold outline-hidden placeholder:text-fg-subtle focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60";

interface FormFieldProps {
  label: string;
  /** id do input — liga o rótulo ao campo (clicar no rótulo foca o campo, leitor de tela anuncia) */
  htmlFor: string;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
}

export default function FormField({ label, htmlFor, required, hint, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <label htmlFor={htmlFor} className="text-[13px] font-extrabold text-fg-muted">
        {label}
        {required && <span className="text-zero ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint}
    </div>
  );
}
