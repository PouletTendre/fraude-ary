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
            className="block text-text-secondary mb-1.5"
            style={{
              fontSize: "12px",
              fontWeight: 510,
            }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              style={{ fontSize: "15px", pointerEvents: "none" }}
            >
              {icon}
            </div>
          )}
          <input
            id={inputId}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={cn(
              "w-full outline-none transition-all duration-150 ease-out bg-transparent placeholder:text-[var(--text-tertiary)]",
              error
                ? "border-[var(--loss)] focus:border-[var(--loss)] focus:shadow-[0_0_0_2px_rgba(248,81,73,0.3)]"
                : "border-[var(--border-input)] focus:border-[var(--primary)] focus:shadow-[var(--shadow-focus)]",
              className
            )}
            style={{
              borderRadius: "var(--r-btn)",
              padding: icon ? "12px 14px 12px 36px" : "12px 14px",
              fontSize: "15px",
              fontWeight: 400,
              fontFamily: "var(--font-sans)",
              borderStyle: "solid",
              borderWidth: "1px",
              color: "var(--text-primary)",
              ...style,
            }}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-label text-loss"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
