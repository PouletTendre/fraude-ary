"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, Sun, Moon, LogOut } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
}

const mainLinks: NavLink[] = [
  { href: "/", label: "Dashboard" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/markets", label: "Marchés" },
  { href: "/assets", label: "Actifs" },
  { href: "/analysis", label: "Analyse" },
  { href: "/simulator", label: "Simulateur" },
];

export default function TopNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) => pathname === href;
  const isLight = resolvedTheme === "light";

  return (
    <>
      <nav
        style={{
          background: "#000000",
          borderBottom: "1px solid #333333",
          padding: "12px 24px 8px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          zIndex: 50,
        }}
      >
        {/* Logo row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div style={{ flex: 1 }} />

          <div style={{ flex: "0 0 auto" }}>
            <Link
              href="/"
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "#FFFFFF",
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
              }}
            >
              Fraude<span style={{ color: "#DA291C" }}>·</span>Ary
            </Link>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 12,
            }}
          >
            <button
              onClick={() => setTheme(isLight ? "dark" : "light")}
              aria-label={
                isLight ? "Passer en mode sombre" : "Passer en mode clair"
              }
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                border: "none",
                color: "#FFFFFF",
                opacity: 0.6,
                cursor: "pointer",
                transition: "opacity 150ms ease-out",
                padding: 0,
                width: 16,
                height: 16,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
            >
              {mounted ? (
                isLight ? (
                  <Moon style={{ width: 16, height: 16 }} />
                ) : (
                  <Sun style={{ width: 16, height: 16 }} />
                )
              ) : (
                <Sun style={{ width: 16, height: 16 }} />
              )}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "#FFFFFF",
                  opacity: 0.8,
                  maxWidth: 160,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.full_name || "User"}
              </span>
              <button
                onClick={logout}
                aria-label="Se déconnecter"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "none",
                  border: "none",
                  color: "#FFFFFF",
                  opacity: 0.4,
                  cursor: "pointer",
                  transition: "opacity 150ms ease-out",
                  padding: 0,
                  width: 16,
                  height: 16,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
              >
                <LogOut style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop links */}
        <div
          style={{
            display: isMobile ? "none" : "flex",
            justifyContent: "center",
            gap: 0,
            marginTop: 8,
          }}
        >
          {mainLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <div key={link.href} style={{ position: "relative" }}>
                <Link
                  href={link.href}
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: active ? "#FFFFFF" : "#8F8F8F",
                    letterSpacing: "0.05em",
                    textDecoration: "none",
                    padding: "4px 12px",
                    display: "inline-block",
                    transition: "color 150ms ease-out",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.color = "#FFFFFF";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.color = "#8F8F8F";
                  }}
                >
                  {link.label}
                </Link>
                {active && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: -1,
                      left: 12,
                      right: 12,
                      height: 1,
                      background: "#DA291C",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
              style={{
                background: "none",
                border: "none",
                color: "#FFFFFF",
                cursor: "pointer",
                padding: 8,
              }}
            >
              <Menu style={{ width: 20, height: 20 }} />
            </button>
          </div>
        )}
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000000",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "20px 20px 0",
            }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer le menu"
              style={{
                background: "none",
                border: "none",
                color: "#FFFFFF",
                cursor: "pointer",
                padding: 8,
              }}
            >
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>

          <div style={{ textAlign: "center", padding: "12px 0 32px" }}>
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "#FFFFFF",
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
              }}
            >
              Fraude<span style={{ color: "#DA291C" }}>·</span>Ary
            </Link>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: 1,
            }}
          >
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: isActive(link.href) ? "#DA291C" : "#FFFFFF",
                  textDecoration: "none",
                  padding: "16px 0",
                  textAlign: "center",
                  borderBottom: "1px solid #222222",
                  width: "100%",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              borderTop: "1px solid #222222",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#FFFFFF",
                opacity: 0.8,
              }}
            >
              {user?.full_name || "User"}
            </span>
            <button
              onClick={() => {
                setMobileOpen(false);
                logout();
              }}
              aria-label="Se déconnecter"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "var(--font-sans)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#FFFFFF",
                opacity: 0.6,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px 16px",
              }}
            >
              <LogOut style={{ width: 14, height: 14 }} />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </>
  );
}
