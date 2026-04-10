"use client";

import { ButtonHTMLAttributes } from "react";

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
}

export default function SecondaryButton({ children, icon, disabled, ...props }: SecondaryButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-display font-semibold text-sm cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${props.className ?? ""}`}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#CBD5E1",
        ...props.style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
        e.currentTarget.style.transform = "";
        props.onMouseLeave?.(e);
      }}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
