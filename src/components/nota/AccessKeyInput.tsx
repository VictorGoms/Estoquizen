"use client";

import { useRef } from "react";

const KEY_LENGTH = 44;

interface AccessKeyInputProps {
  value: string;
  onChange: (val: string) => void;
}

function formatKey(raw: string): string {
  // Insert spaces every 4 chars for readability (44-digit NF-e key)
  return raw.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
}

export default function AccessKeyInput({ value, onChange }: AccessKeyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const digits = value.replace(/\s/g, "").length;
  const pct = Math.min((digits / KEY_LENGTH) * 100, 100);
  const complete = digits === KEY_LENGTH;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, KEY_LENGTH);
    onChange(raw);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <label htmlFor="access-key" className="text-sm font-medium text-slate-300">
          Chave de acesso
        </label>
        <span
          className={`text-xs font-semibold transition-colors duration-200 ${
            complete ? "text-emerald-400" : digits > 0 ? "text-brand-400" : "text-slate-600"
          }`}
        >
          {digits} de {KEY_LENGTH} dígitos
        </span>
      </div>

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          id="access-key"
          type="text"
          inputMode="numeric"
          value={formatKey(value)}
          onChange={handleChange}
          placeholder="Digite a chave de acesso (44 dígitos)"
          maxLength={KEY_LENGTH + Math.ceil(KEY_LENGTH / 4) - 1} // account for spaces
          autoComplete="off"
          spellCheck={false}
          className="w-full px-4 py-3.5 rounded-xl text-sm placeholder-slate-600 outline-none transition-all duration-200 font-mono tracking-wider"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: complete
              ? "1px solid rgba(16,185,129,0.5)"
              : "1px solid rgba(255,255,255,0.09)",
            color: complete ? "#6EE7B7" : "#E2E8F0",
            boxShadow: complete ? "0 0 0 3px rgba(16,185,129,0.1)" : undefined,
          }}
          onFocus={(e) => {
            if (!complete) {
              e.currentTarget.style.border = "1px solid rgba(59,130,246,0.6)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)";
            }
          }}
          onBlur={(e) => {
            if (!complete) {
              e.currentTarget.style.border = "1px solid rgba(255,255,255,0.09)";
              e.currentTarget.style.boxShadow = "none";
            }
          }}
        />
        {/* Complete check */}
        {complete && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#059669,#10B981)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: complete
              ? "linear-gradient(90deg,#059669,#10B981)"
              : "linear-gradient(90deg,#1d4ed8,#3b82f6)",
          }}
        />
      </div>

      {/* Paste tip */}
      {digits === 0 && (
        <p className="text-[11px] text-slate-700">
          Dica: você pode colar diretamente a chave copiada da SEFAZ.
        </p>
      )}
    </div>
  );
}
