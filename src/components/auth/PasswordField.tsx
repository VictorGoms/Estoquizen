"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";

interface PasswordFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  rightSlot?: React.ReactNode;
}

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, id, rightSlot, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id ?? "password";

    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
            {label}
          </label>
          {rightSlot}
        </div>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            {...props}
            className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${error ? "rgba(244,63,94,0.5)" : "rgba(255,255,255,0.09)"}`,
              boxShadow: error ? "0 0 0 2px rgba(244,63,94,0.12)" : undefined,
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = error
                ? "1px solid rgba(244,63,94,0.8)"
                : "1px solid rgba(59,130,246,0.6)";
              e.currentTarget.style.boxShadow = error
                ? "0 0 0 3px rgba(244,63,94,0.15)"
                : "0 0 0 3px rgba(59,130,246,0.15)";
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = error
                ? "1px solid rgba(244,63,94,0.5)"
                : "1px solid rgba(255,255,255,0.09)";
              e.currentTarget.style.boxShadow = "none";
              props.onBlur?.(e);
            }}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors duration-200 cursor-pointer p-0.5"
          >
            <EyeIcon open={visible} />
          </button>
        </div>
        {error && <p className="text-xs text-rose-400 mt-0.5">{error}</p>}
      </div>
    );
  }
);
PasswordField.displayName = "PasswordField";
export default PasswordField;
