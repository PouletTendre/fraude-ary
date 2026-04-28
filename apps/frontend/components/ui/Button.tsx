import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center gap-[6px] cursor-pointer transition-all duration-150 ease-out whitespace-nowrap no-underline uppercase font-body focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white hover:bg-accent-teal focus-visible:outline-black",
        secondary:
          "bg-surface-raised text-text-primary border border-border hover:bg-surface",
        ghost:
          "bg-transparent text-text-secondary border border-transparent hover:bg-accent-teal hover:text-white",
        danger:
          "bg-loss text-white hover:bg-[#D63025]",
      },
      size: {
        default: "",
        sm: "",
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
    const sizeStyle =
      size === "sm"
        ? { padding: "7px 10px", fontSize: "0.875rem", letterSpacing: "0.96px" }
        : { padding: "12px 10px", fontSize: "1rem", letterSpacing: "1.28px" };

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={{
          borderRadius: "var(--r-md)",
          ...sizeStyle,
          ...style,
        }}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
