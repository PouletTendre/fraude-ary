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
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          width: "100%",
          textAlign: "left",
          fontSize: "13px",
          fontFamily: "var(--font-body)",
          textTransform: "uppercase",
          letterSpacing: "1px",
          padding: "8px 10px",
          borderRadius: "var(--r-md)",
          background: "transparent",
          border: "1px solid transparent",
          color: "var(--text-secondary)",
          cursor: "pointer",
          transition: "all 150ms ease-out",
        }}
      >
        <Sun style={{ width: "16px", height: "16px" }} />
        <span>Theme</span>
      </button>
    );
  }

  const isLight = resolvedTheme === "light";

  return (
    <>
      <style>{`
        .theme-toggle-ghost:hover {
          color: var(--text-primary);
          border-color: var(--border);
        }
      `}</style>
      <button
        onClick={() => setTheme(isLight ? "dark" : "light")}
        aria-label={isLight ? "Passer en mode sombre" : "Passer en mode clair"}
        className="theme-toggle-ghost"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          width: "100%",
          textAlign: "left",
          fontSize: "13px",
          fontFamily: "var(--font-body)",
          textTransform: "uppercase",
          letterSpacing: "1px",
          padding: "8px 10px",
          borderRadius: "var(--r-md)",
          background: "transparent",
          border: "1px solid transparent",
          color: "var(--text-secondary)",
          cursor: "pointer",
          transition: "all 150ms ease-out",
        }}
      >
        {isLight ? (
          <Moon style={{ width: "16px", height: "16px" }} />
        ) : (
          <Sun style={{ width: "16px", height: "16px" }} />
        )}
        <span>{isLight ? "Dark mode" : "Light mode"}</span>
      </button>
    </>
  );
}
