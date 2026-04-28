"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface PageSectionProps extends HTMLAttributes<HTMLDivElement> {
  paddingY?: string;
  maxWidth?: string;
  fullWidth?: boolean;
}

const PageSection = forwardRef<HTMLDivElement, PageSectionProps>(
  (
    {
      paddingY = "48px",
      maxWidth = "1200px",
      fullWidth = false,
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <section
        ref={ref}
        className={cn("w-full", className)}
        style={{
          paddingTop: paddingY,
          paddingBottom: paddingY,
          paddingLeft: "32px",
          paddingRight: "32px",
          ...style,
        }}
        {...rest}
      >
        {fullWidth ? (
          children
        ) : (
          <div style={{ maxWidth, margin: "0 auto" }}>{children}</div>
        )}
      </section>
    );
  },
);

PageSection.displayName = "PageSection";

export { PageSection };
export type { PageSectionProps };
