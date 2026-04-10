import { InputHTMLAttributes, forwardRef } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-300"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          {...props}
          className={`w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 ${
            error
              ? "border-rose-500/70 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
              : "border-white/10 focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/20"
          } ${props.className ?? ""}`}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${error ? "rgba(244,63,94,0.5)" : "rgba(255,255,255,0.09)"}`,
          }}
        />
        {error && (
          <p className="text-xs text-rose-400 mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);
InputField.displayName = "InputField";
export default InputField;
