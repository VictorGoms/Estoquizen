import { InputHTMLAttributes, forwardRef } from "react";
import { inputClass } from "@/components/ui/FormField";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    const errorId = `${inputId}-erro`;

    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-[13px] font-extrabold text-fg-muted">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
          className={`${inputClass} ${error ? "ring-2 ring-zero/70" : ""} ${className ?? ""}`}
        />
        {error && <p id={errorId} className="text-[13px] font-bold text-zero">{error}</p>}
      </div>
    );
  }
);
InputField.displayName = "InputField";
export default InputField;
