"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";
import { inputClass } from "@/components/ui/FormField";

interface PasswordFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  rightSlot?: React.ReactNode;
}

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, id, rightSlot, className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id ?? "password";
    const errorId = `${inputId}-erro`;

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={inputId} className="text-[13px] font-extrabold text-fg-muted">
            {label}
          </label>
          {rightSlot}
        </div>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            {...props}
            className={`${inputClass} pr-14 ${error ? "ring-2 ring-zero/70" : ""} ${className ?? ""}`}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={visible}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-fg-subtle hover:text-fg cursor-pointer transition-colors"
          >
            <EyeIcon open={visible} />
          </button>
        </div>
        {error && <p id={errorId} className="text-[13px] font-bold text-zero">{error}</p>}
      </div>
    );
  }
);
PasswordField.displayName = "PasswordField";
export default PasswordField;
