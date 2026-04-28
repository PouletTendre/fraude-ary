import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "cinematic";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, style, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(className)}
        style={{
          backgroundColor:
            variant === "cinematic" ? "#000000" : "var(--surface)",
          borderRadius: 0,
          padding: "20px",
          ...(variant === "cinematic"
            ? {
                "--text-primary": "#FFFFFF",
                "--text-secondary": "#FFFFFF",
                "--text-tertiary": "#FFFFFF",
              }
            : {}),
          ...style,
        } as React.CSSProperties}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

interface CardImageProps extends HTMLAttributes<HTMLDivElement> {
  src: string;
  alt?: string;
}

export const CardImage = forwardRef<HTMLDivElement, CardImageProps>(
  ({ src, alt = "", className, style, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(className)} style={style} {...props}>
        <img
          src={src}
          alt={alt}
          style={{ width: "100%", display: "block", borderRadius: 0 }}
        />
      </div>
    );
  }
);

CardImage.displayName = "CardImage";

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

export const CardLabel = forwardRef<
  HTMLSpanElement,
  HTMLAttributes<HTMLSpanElement>
>(({ className, style, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(className)}
      style={{
        fontFamily: "var(--font-body)",
        textTransform: "uppercase",
        fontSize: "12px",
        fontWeight: 400,
        letterSpacing: "1px",
        color: "var(--text-tertiary)",
        ...style,
      }}
      {...props}
    />
  );
});

CardLabel.displayName = "CardLabel";

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, style, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn(className)}
      style={{
        fontSize: "1.5rem",
        fontWeight: 400,
        letterSpacing: "normal",
        color: "var(--text-primary)",
        margin: 0,
        ...style,
      }}
      {...props}
    />
  );
});

CardTitle.displayName = "CardTitle";

export const CardCaption = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, style, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn(className)}
      style={{
        fontFamily: "var(--font-body)",
        textTransform: "uppercase",
        fontSize: "13px",
        fontWeight: 400,
        letterSpacing: "1px",
        color: "var(--text-secondary)",
        margin: 0,
        ...style,
      }}
      {...props}
    />
  );
});

CardCaption.displayName = "CardCaption";

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
