import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-[4px] whitespace-nowrap font-body uppercase",
  {
    variants: {
      variant: {
        gain: "bg-gain-muted text-gain",
        loss: "bg-loss-muted text-loss",
        warning: "bg-warning-muted text-warning",
        info: "bg-info-muted text-info",
        neutral: "bg-surface-raised text-text-secondary",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        style={{
          borderRadius: "var(--r-md)",
          padding: "4px 10px",
          fontSize: "0.6875rem",
          fontWeight: 500,
          letterSpacing: "1px",
          lineHeight: 1,
        }}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";
