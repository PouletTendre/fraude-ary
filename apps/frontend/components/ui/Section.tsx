"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  variant?: "hero" | "editorial" | "cinematic";
  as?: "section" | "div" | "header" | "footer";
  maxWidth?: string;
  paddingY?: string;
}

const variantPadding: Record<string, string> = {
  hero: "py-10 px-4 md:py-20 md:px-8",
  editorial: "py-8 px-4 md:py-[60px] md:px-8",
  cinematic: "py-10 px-4 md:py-20 md:px-8",
};

const variantStyles: Record<string, React.CSSProperties> = {
  hero: {
    background: "var(--bg)",
    color: "var(--text-primary)",
  },
  editorial: {
    background: "var(--surface)",
    color: "var(--text-primary)",
    borderBottom: "1px solid var(--border)",
  },
  cinematic: {
    background: "#000000",
    color: "#FFFFFF",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
};

const Section = forwardRef<HTMLElement, SectionProps>(
  (
    {
      variant = "hero",
      as: Component = "section",
      maxWidth = "1920px",
      paddingY,
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) => {
    const v = variantStyles[variant] ?? variantStyles.hero;
    const p = variantPadding[variant] ?? variantPadding.hero;

    return (
      <Component
        ref={ref}
        className={cn("w-full", p, className)}
        style={{
          ...v,
          ...(paddingY !== undefined && {
            paddingTop: paddingY,
            paddingBottom: paddingY,
          }),
          ...style,
        }}
        {...rest}
      >
        <div style={{ maxWidth, margin: "0 auto" }}>{children}</div>
      </Component>
    );
  },
);

Section.displayName = "Section";

export { Section };
export type { SectionProps };
