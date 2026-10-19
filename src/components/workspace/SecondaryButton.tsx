"use client";

import { ButtonHTMLAttributes } from "react";

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
}

export default function SecondaryButton({ children, icon, disabled, className, ...props }: SecondaryButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`w-full min-h-[52px] flex items-center justify-center gap-2 px-6 rounded-full bg-surface text-[15px] font-extrabold text-fg cursor-pointer transition-colors duration-200 hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed ${className ?? ""}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
