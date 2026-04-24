import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes, forwardRef } from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-label font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-surface-raised text-text-secondary border border-border",
        success: "bg-accent/10 text-accent border border-accent/20",
        warning: "bg-warning/10 text-warning border border-warning/20",
        error: "bg-danger/10 text-danger border border-danger/20",
        info: "bg-primary/10 text-primary border border-primary/20",
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
