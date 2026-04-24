import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes, forwardRef } from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-[10px] py-[4px] text-label font-medium uppercase tracking-wide transition-colors",
  {
    variants: {
      variant: {
        gain: "bg-gain-muted text-gain",
        loss: "bg-loss-muted text-loss",
        warning: "bg-warning-muted text-warning",
        info: "bg-primary-subtle text-primary-hover",
        neutral: "bg-surface-raised text-text-secondary",
      },
    },
    defaultVariants: {
      variant: "neutral",
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
