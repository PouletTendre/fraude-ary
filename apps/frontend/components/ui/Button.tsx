import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ButtonHTMLAttributes, forwardRef, useLayoutEffect, useState } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-[6px] cursor-pointer transition-all duration-150 ease-out whitespace-nowrap no-underline font-[510] select-none",
  {
    variants: {
      variant: {
        ghost:
          "bg-[rgba(255,255,255,0.02)] text-[#e2e4e7] border border-solid border-[var(--border-solid)] hover:bg-[rgba(255,255,255,0.05)] focus-visible:shadow-[var(--shadow-card)]",
        subtle:
          "bg-[rgba(255,255,255,0.04)] text-[#d0d6e0] focus-visible:shadow-[var(--shadow-card)]",
        brand:
          "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] focus-visible:shadow-[var(--shadow-focus)]",
        pill:
          "bg-transparent text-[#d0d6e0] border border-solid border-[var(--border-solid)]",
        toolbar:
          "bg-[rgba(255,255,255,0.05)] text-[#62666d] border border-solid border-[var(--border-subtle)] shadow-[rgba(0,0,0,0.03)_0px_1.2px_0px_0px]",
      },
      size: {
        default: "",
        sm: "",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, style, ...props }, ref) => {
    const [isLight, setIsLight] = useState(false);

    useLayoutEffect(() => {
      const root = document.documentElement;
      setIsLight(root.classList.contains("light"));
      const observer = new MutationObserver(() => {
        setIsLight(root.classList.contains("light"));
      });
      observer.observe(root, { attributes: true, attributeFilter: ["class"] });
      return () => observer.disconnect();
    }, []);

    const sizeStyle =
      size === "sm"
        ? { fontSize: "12px", padding: "4px 8px" }
        : { fontSize: "15px", padding: "8px 16px" };

    const variantRadius: Record<string, string> = {
      ghost: "var(--r-btn)",
      subtle: "6px",
      brand: "6px",
      pill: "9999px",
      toolbar: "2px",
    };

    const variantPadding: Record<string, string | undefined> = {
      subtle: "0px 6px",
      pill: "0px 10px 0px 5px",
    };

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={{
          borderRadius:
            (variant && variantRadius[variant]) || "var(--r-btn)",
          ...sizeStyle,
          ...(variant && variantPadding[variant]
            ? { padding: variantPadding[variant] }
            : {}),
          ...style,
        }}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
