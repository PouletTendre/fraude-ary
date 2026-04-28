import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ButtonHTMLAttributes, forwardRef, useLayoutEffect, useState } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-[6px] cursor-pointer transition-all duration-150 ease-out whitespace-nowrap no-underline font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
  {
    variants: {
      variant: {
        white:
          "bg-white text-black border border-black hover:bg-accent-teal hover:text-white hover:border-accent-teal hover:opacity-90 focus-visible:bg-accent-teal focus-visible:text-white focus-visible:border-white focus-visible:outline-black focus-visible:opacity-90",
        subscribe:
          "bg-primary text-white hover:bg-primary-hover focus-visible:bg-primary-hover focus-visible:outline-black",
        ghost:
          "bg-transparent hover:bg-accent-teal hover:text-white hover:border-accent-teal hover:opacity-90 focus-visible:bg-accent-teal focus-visible:text-white focus-visible:border-white focus-visible:outline-black focus-visible:opacity-90",
        danger:
          "bg-loss text-white hover:bg-[#D63025] focus-visible:outline-black",
      },
      size: {
        default: "",
        sm: "",
      },
    },
    defaultVariants: {
      variant: "white",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, style, ...props }, ref) => {
    const [isLight, setIsLight] = useState(false);

    useLayoutEffect(() => {
      const root = document.documentElement;
      setIsLight(root.classList.contains("light"));
      const observer = new MutationObserver(() => {
        setIsLight(root.classList.contains("light"));
      });
      observer.observe(root, { attributes: true, attributeFilter: ["class"] });
      return () => observer.disconnect();
    }, []);

    const sizeStyle =
      size === "sm"
        ? { padding: "7px 10px", fontSize: "0.875rem", letterSpacing: "0.96px" }
        : { padding: "12px 10px", fontSize: "1rem", letterSpacing: "1.28px" };

    const ghostLightStyle =
      variant === "ghost" && isLight
        ? { color: "#000000", borderColor: "#000000" }
        : variant === "ghost"
        ? { color: "#FFFFFF", borderColor: "#FFFFFF" }
        : {};

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={{
          borderRadius: "var(--r-md)",
          ...sizeStyle,
          ...ghostLightStyle,
          ...style,
        }}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
