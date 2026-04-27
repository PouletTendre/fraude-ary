"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Theme settings"
        className="flex items-center gap-[10px] w-full text-left text-[13px] text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-all duration-150 ease-out"
        style={{
          padding: "8px 12px",
          borderRadius: "8px",
          background: "transparent",
          border: "none",
        }}
      >
        <Sun style={{ width: "16px", height: "16px" }} />
        <span>Theme</span>
      </button>
    );
  }

  const isLight = resolvedTheme === "light";

  return (
    <button
      onClick={() => setTheme(isLight ? "dark" : "light")}
      aria-label={isLight ? "Passer en mode sombre" : "Passer en mode clair"}
      className="flex items-center gap-[10px] w-full text-left text-[13px] text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-all duration-150 ease-out"
      style={{
        padding: "8px 12px",
        borderRadius: "8px",
        background: "transparent",
        border: "none",
      }}
    >
      {isLight ? (
        <Moon style={{ width: "16px", height: "16px" }} />
      ) : (
        <Sun style={{ width: "16px", height: "16px" }} />
      )}
      <span>{isLight ? "Dark mode" : "Light mode"}</span>
    </button>
  );
}
