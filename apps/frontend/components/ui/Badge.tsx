import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-[4px] whitespace-nowrap font-[510]",
  {
    variants: {
      variant: {
        success:
          "bg-[#10b981] text-[#f7f8f8]",
        neutral:
          "bg-transparent text-[#d0d6e0] border border-solid border-[var(--border-solid)]",
        subtle:
          "bg-[rgba(255,255,255,0.05)] text-[#f7f8f8] border border-solid border-[var(--border-subtle)]",
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
    const variantRadius: Record<string, string> = {
      success: "50%",
      neutral: "9999px",
      subtle: "2px",
    };

    const variantPadding: Record<string, string> = {
      success: "2px 6px",
      neutral: "0px 10px 0px 5px",
      subtle: "0px 8px 0px 2px",
    };

    const variantSize: Record<string, string> = {
      success: "10px",
      neutral: "12px",
      subtle: "10px",
    };

    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        style={{
          borderRadius:
            (variant && variantRadius[variant]) || "9999px",
          padding:
            (variant && variantPadding[variant]) || "0px 10px 0px 5px",
          fontSize:
            (variant && variantSize[variant]) || "12px",
          lineHeight: 1,
        }}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";
