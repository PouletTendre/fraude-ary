import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

const cardBase = "border border-border rounded-[var(--r-lg)]";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardBase, "bg-surface", className)}
        style={{ padding: "20px 24px", ...style }}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-[6px]", className)}
        style={{ paddingBottom: "12px", ...style }}
        {...props}
      />
    );
  }
);

CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn("text-[1rem] font-semibold text-text-primary", className)}
        {...props}
      />
    );
  }
);

CardTitle.displayName = "CardTitle";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex flex-col gap-[12px]", className)} {...props} />
    );
  }
);

CardContent.displayName = "CardContent";
