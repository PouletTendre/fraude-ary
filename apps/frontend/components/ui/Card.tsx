import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("bg-surface", className)}
        style={{
          borderRadius: "var(--r-md)",
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
>(({ className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn(
        "text-[1rem] font-bold text-text-primary",
        className
      )}
      style={{ marginBottom: 0 }}
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
