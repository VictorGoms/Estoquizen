"use client";

import { ButtonHTMLAttributes } from "react";
import { Spinner } from "@/components/ui/icons";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export default function PrimaryButton({ children, loading, disabled, className, ...props }: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`w-full min-h-[54px] flex items-center justify-center gap-2 px-6 rounded-full bg-accent text-ink text-base font-black cursor-pointer transition-[filter] duration-200 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 ${className ?? ""}`}
    >
      {loading ? (
        <>
          <Spinner className="w-5 h-5" />
          <span>Aguarde…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
