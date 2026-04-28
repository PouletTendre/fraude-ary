import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(className)}
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-card)",
          boxShadow: "var(--shadow-card)",
          padding: "20px",
          ...style,
        }}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-[6px]", className)}
      style={{ paddingBottom: "8px", ...style }}
      {...props}
    />
  );
});

CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, style, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn(className)}
      style={{
        fontSize: "1.25rem",
        fontWeight: 590,
        letterSpacing: "-0.24px",
        color: "var(--text-primary)",
        margin: 0,
        ...style,
      }}
      {...props}
    />
  );
});

CardTitle.displayName = "CardTitle";

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-[12px]", className)}
      {...props}
    />
  );
});

CardContent.displayName = "CardContent";
