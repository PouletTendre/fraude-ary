import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center gap-[6px] border-none rounded-[var(--r-md)] font-medium font-sans cursor-pointer transition-all duration-150 ease-out whitespace-nowrap no-underline",
  {
    variants: {
      variant: {
        primary:   "bg-primary text-text-primary hover:bg-primary-hover hover:shadow-glow",
        secondary: "bg-surface-raised text-text-primary border border-border hover:bg-surface hover:border-border-hover",
        ghost:     "bg-transparent text-text-secondary border border-transparent hover:bg-white/[0.04] hover:text-text-primary",
        danger:    "bg-loss text-text-primary hover:bg-loss-hover",
      },
      size: {
        default: "text-[14px] font-medium",
        sm:      "text-[13px] font-medium",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, style, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={{
          padding: size === "sm" ? "7px 12px" : "10px 16px",
          ...style,
        }}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
