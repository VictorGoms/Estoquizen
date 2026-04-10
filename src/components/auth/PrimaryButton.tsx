"use client";

import { ButtonHTMLAttributes } from "react";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export default function PrimaryButton({ children, loading, disabled, ...props }: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-display font-semibold text-sm text-white cursor-pointer transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none ${props.className ?? ""}`}
      style={{
        background: isDisabled
          ? "linear-gradient(135deg, #1d4ed8, #2563eb)"
          : "linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)",
        boxShadow: isDisabled ? "none" : "0 4px 20px rgba(37,99,235,0.4)",
        ...props.style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.boxShadow = "0 6px 28px rgba(37,99,235,0.65)";
          e.currentTarget.style.filter = "brightness(1.08)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,99,235,0.4)";
        e.currentTarget.style.filter = "";
        e.currentTarget.style.transform = "";
        props.onMouseLeave?.(e);
      }}
      onMouseDown={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 12px rgba(37,99,235,0.4)";
        }
        props.onMouseDown?.(e);
      }}
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Aguarde...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
