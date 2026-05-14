"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, LogOut, LayoutDashboard, PieChart, TrendingUp, Briefcase, Search, Calculator, ScrollText, Banknote, Layers, BellRing, Settings, Bell } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const mainLinks: NavLink[] = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/portfolio", label: "Portfolio", icon: <PieChart size={18} /> },
  { href: "/markets", label: "Marchés", icon: <TrendingUp size={18} /> },
  { href: "/assets", label: "Actifs", icon: <Briefcase size={18} /> },
  { href: "/research", label: "Research", icon: <Search size={18} /> },
  { href: "/simulator", label: "Simulateur", icon: <Calculator size={18} /> },
];

const manageLinks: NavLink[] = [
  { href: "/journal", label: "Journal", icon: <ScrollText size={18} /> },
  { href: "/dividends", label: "Dividendes", icon: <Banknote size={18} /> },
  { href: "/diversification", label: "Diversification", icon: <Layers size={18} /> },
  { href: "/alerts", label: "Alertes", icon: <BellRing size={18} /> },
];

const bottomLinks: NavLink[] = [
  { href: "/settings", label: "Settings", icon: <Settings size={18} /> },
  { href: "/notifications", label: "Notifications", icon: <Bell size={18} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg)",
        borderRight: "1px solid var(--border-subtle)",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 20px 24px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: "18px",
            fontWeight: 590,
            color: "var(--text-primary)",
            textDecoration: "none",
            fontFamily: "var(--font-sans)",
            letterSpacing: "-0.18px",
          }}
        >
          Fraude-Ary
        </Link>
      </div>

      {/* Main nav */}
      <nav
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "12px 10px 0",
          gap: "2px",
          overflowY: "auto",
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
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "var(--r-btn)",
                fontSize: "13px",
                fontWeight: active ? 510 : 400,
                color: active ? "var(--primary)" : "var(--text-secondary)",
                textDecoration: "none",
                background: active ? "var(--primary-subtle)" : "transparent",
                transition: "background 150ms ease-out, color 150ms ease-out",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "var(--surface-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              <span
                style={{
                  opacity: active ? 1 : 0.55,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}

        {/* Gestion section */}
        <div
          style={{
            fontSize: "10px",
            fontWeight: 590,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "1px",
            padding: "16px 12px 6px",
          }}
        >
          Gestion
        </div>

        {manageLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "var(--r-btn)",
                fontSize: "13px",
                fontWeight: active ? 510 : 400,
                color: active ? "var(--primary)" : "var(--text-secondary)",
                textDecoration: "none",
                background: active ? "var(--primary-subtle)" : "transparent",
                transition: "background 150ms ease-out, color 150ms ease-out",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "var(--surface-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              <span
                style={{
                  opacity: active ? 1 : 0.55,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div
        style={{
          padding: "8px 10px",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        {bottomLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "var(--r-btn)",
                fontSize: "13px",
                fontWeight: active ? 510 : 400,
                color: active ? "var(--primary)" : "var(--text-secondary)",
                textDecoration: "none",
                background: active ? "var(--primary-subtle)" : "transparent",
                transition: "background 150ms ease-out, color 150ms ease-out",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "var(--surface-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              <span
                style={{
                  opacity: active ? 1 : 0.55,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* User section */}
      <div
        style={{
          padding: "16px",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "var(--r-full)",
            background: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "13px",
            fontWeight: 590,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {(user?.full_name || "U")[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 510,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user?.full_name || "User"}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-tertiary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user?.email || ""}
          </div>
        </div>
        <button
          onClick={() => {
            setMobileOpen(false);
            logout();
          }}
          aria-label="Se déconnecter"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "none",
            color: "var(--text-tertiary)",
            cursor: "pointer",
            padding: "6px",
            borderRadius: "var(--r-btn)",
            transition: "color 150ms ease-out, background 150ms ease-out",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--loss)";
            e.currentTarget.style.background = "var(--loss-muted)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-tertiary)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "256px",
          zIndex: 40,
          display: isMobile ? "none" : "block",
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile toggle */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          style={{
            position: "fixed",
            top: "12px",
            left: "12px",
            zIndex: 41,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-btn)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Menu size={20} />
        </button>
      )}

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
          }}
        >
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--overlay)",
            }}
          />
          <div
            style={{
              position: "relative",
              width: "280px",
              height: "100%",
              zIndex: 1,
            }}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
