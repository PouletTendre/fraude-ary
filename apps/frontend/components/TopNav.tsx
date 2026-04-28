"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, LogOut } from "lucide-react";

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
  const router = useRouter();
  const { user, logout } = useAuth();
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

  if (!mounted) {
    return (
      <nav
        style={{
          position: "sticky",
          top: 0,
          background: "var(--surface)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "12px 24px",
          height: 48,
          zIndex: 50,
        }}
      />
    );
  }

  return (
    <>
      <nav
        style={{
          position: "sticky",
          top: 0,
          background: "var(--surface)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 50,
        }}
      >
        {/* Left: logo + nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <Link
            href="/"
            style={{
              fontSize: 16,
              fontWeight: 590,
              color: "var(--text-primary)",
              textDecoration: "none",
              fontFamily: "var(--font-sans)",
            }}
          >
            Fraude-Ary
          </Link>

          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {mainLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 13,
                      fontWeight: 510,
                      color: active
                        ? "var(--text-primary)"
                        : "var(--text-secondary)",
                      letterSpacing: "-0.13px",
                      textDecoration: "none",
                      padding: "4px 12px",
                      display: "inline-block",
                      transition: "color 150ms ease-out",
                    }}
                    onMouseEnter={(e) => {
                      if (!active)
                        e.currentTarget.style.color = "var(--text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active)
                        e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: user name + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isMobile && (
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Menu style={{ width: 20, height: 20 }} />
            </button>
          )}

          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: 510,
              color: "var(--text-primary)",
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
              color: "var(--text-tertiary)",
              cursor: "pointer",
              transition: "color 150ms ease-out",
              padding: 4,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-primary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-tertiary)")
            }
          >
            <LogOut style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </nav>

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--surface)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 24px",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              style={{
                fontSize: 16,
                fontWeight: 590,
                color: "var(--text-primary)",
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
              }}
            >
              Fraude-Ary
            </Link>

            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer le menu"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              padding: "16px 0",
            }}
          >
            {mainLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 15,
                    fontWeight: 510,
                    color: active
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                    textDecoration: "none",
                    padding: "16px 24px",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 510,
                color: "var(--text-primary)",
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
                fontSize: 13,
                fontWeight: 510,
                color: "var(--text-secondary)",
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
