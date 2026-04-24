import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes, forwardRef } from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-label font-medium transition-colors uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-surface-raised text-text-secondary border border-border",
        success: "bg-gain-muted text-gain border border-gain/20",
        warning: "bg-warning-muted text-warning border border-warning/20",
        error: "bg-loss-muted text-loss border border-loss/20",
        info: "bg-primary-subtle text-primary-hover border border-primary/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";
