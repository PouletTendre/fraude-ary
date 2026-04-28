"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface SectionProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "hero" | "editorial" | "cinematic";
  maxWidth?: string;
  paddingY?: string;
}

const variantPadding: Record<string, string> = {
  hero: "py-10 px-4 md:py-14 md:px-8",
  editorial: "py-6 px-4 md:py-8 md:px-8",
  cinematic: "py-10 px-4 md:py-14 md:px-8",
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
    background: "var(--surface-sunken)",
    color: "var(--text-primary)",
    borderTop: "1px solid var(--border)",
    borderBottom: "1px solid var(--border)",
  },
};

const Section = forwardRef<HTMLDivElement, SectionProps>(
  (
    {
      variant = "hero",
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
      <section
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
      </section>
    );
  },
);

Section.displayName = "Section";

export { Section };
export type { SectionProps };
