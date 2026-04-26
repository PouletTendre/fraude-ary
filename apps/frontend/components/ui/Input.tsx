import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, icon, style, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[0.875rem] font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" style={{ fontSize: "15px", pointerEvents: "none" }}>
              {icon}
            </div>
          )}
          <input
            id={inputId}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={cn(
              "w-full outline-none transition-all duration-150 ease-out bg-surface-sunken text-text-primary placeholder:text-text-muted",
              "focus:ring-2 focus:ring-primary focus:border-primary-hover",
              error && "border-loss focus:ring-loss",
              className
            )}
            style={{
              border: error ? "1px solid var(--loss)" : "1px solid var(--border)",
              borderRadius: "var(--r-md)",
              padding: icon ? "10px 14px 10px 36px" : "10px 14px",
              fontSize: "14px",
              fontFamily: "var(--font-sans)",
              ...style,
            }}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-label text-loss" role="alert">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
