"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useAlerts } from "@/hooks/useAlerts";
import { fetchApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import {
  Menu,
  X,
  ChevronDown,
  RefreshCw,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  hasDropdown?: boolean;
  dropdown?: NavLink[];
}

const mainLinks: NavLink[] = [
  { href: "/", label: "Dashboard" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/markets", label: "Marchés" },
  { href: "/assets", label: "Actifs" },
  { href: "/analysis", label: "Analyse" },
  { href: "/simulator", label: "Simulateur" },
];

const gestionLinks: NavLink[] = [
  { href: "/alerts", label: "Alertes" },
  { href: "/notifications", label: "Notifications" },
  { href: "/journal", label: "Transactions" },
  { href: "/dividends", label: "Dividendes" },
  { href: "/settings", label: "Paramètres" },
];

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { alerts } = useAlerts();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGestionOpen, setMobileGestionOpen] = useState(false);
  const [gestionHover, setGestionHover] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const activeAlertCount = alerts.filter((a) => a.is_active).length;

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
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchApi("/api/v1/prices/refresh", { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["assets"] });
      await queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      await queryClient.invalidateQueries({ queryKey: ["diversification"] });
    } finally {
      setIsRefreshing(false);
    }
  };

  const isActive = (href: string) => pathname === href;

  const getBadgeCount = (href: string): number | undefined => {
    if (href === "/alerts") return activeAlertCount;
    if (href === "/notifications") return unreadCount;
    return undefined;
  };

  const isLight = resolvedTheme === "light";

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileGestionOpen(false);
  };

  const linkStyle = (
    active: boolean,
  ): React.CSSProperties => ({
    fontFamily: "var(--font-sans)",
    fontSize: "0.8125rem",
    fontWeight: 600,
    letterSpacing: "0.13px",
    color: "#FFFFFF",
    textDecoration: "none",
    padding: "8px 16px",
    position: "relative" as const,
    transition: "color 150ms ease-out",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "none",
    border: "none",
    lineHeight: "1.2",
  });

  const LinkIndicator = ({ active }: { active: boolean }) =>
    active ? (
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 16,
          right: 16,
          height: 2,
          background: "#DA291C",
        }}
      />
    ) : null;

  return (
    <>
      <nav
        style={{
          background: "#000000",
          borderBottom: "1px solid #333333",
          position: "relative",
          zIndex: 50,
        }}
      >
        {/* Top utilities bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "12px",
            padding: "8px 20px",
          }}
        >
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(isLight ? "dark" : "light")}
            aria-label={isLight ? "Passer en mode sombre" : "Passer en mode clair"}
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
              width: "16px",
              height: "16px",
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

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Actualiser les prix"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              color: "#FFFFFF",
              opacity: isRefreshing ? 1 : 0.6,
              cursor: "pointer",
              transition: "opacity 150ms ease-out",
              padding: 0,
              width: "16px",
              height: "16px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => {
              if (!isRefreshing) e.currentTarget.style.opacity = "0.6";
            }}
          >
            <RefreshCw
              style={{ width: 16, height: 16 }}
              className={cn(isRefreshing && "animate-spin")}
            />
          </button>

          {/* Notification badge */}
          {unreadCount > 0 && (
            <Link href="/notifications" aria-label={`${unreadCount} notifications non lues`}>
              <Badge variant="info" style={{ fontSize: "9px", padding: "2px 6px" }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            </Link>
          )}

          {/* Alert badge */}
          {activeAlertCount > 0 && (
            <Link href="/alerts" aria-label={`${activeAlertCount} alertes actives`}>
              <Badge variant="warning" style={{ fontSize: "9px", padding: "2px 6px" }}>
                {activeAlertCount > 9 ? "9+" : activeAlertCount}
              </Badge>
            </Link>
          )}

          {/* User area */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-sans)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "#FFFFFF",
              opacity: 0.8,
            }}
          >
            <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                width: "16px",
                height: "16px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
            >
              <LogOut style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* Logo — centered */}
        <div style={{ textAlign: "center", padding: "20px 0 12px" }}>
          <Link
            href="/"
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "#FFFFFF",
              textDecoration: "none",
              letterSpacing: "normal",
              fontFamily: "var(--font-sans)",
            }}
          >
            Fraude<span style={{ color: "#DA291C" }}>·</span>Ary
          </Link>
        </div>

        {/* Desktop nav links */}
        <div
          className="hidden md:flex"
          style={{
            display: isMobile ? "none" : "flex",
            justifyContent: "center",
            gap: 0,
            padding: "0 24px 16px",
          }}
        >
          {mainLinks.map((link) => (
            <div key={link.href} style={{ position: "relative" }}>
              <Link href={link.href} style={linkStyle(isActive(link.href))}>
                {link.label}
                {getBadgeCount(link.href) ? (
                  <Badge variant="info" style={{ fontSize: "9px", padding: "2px 6px" }}>
                    {getBadgeCount(link.href)! > 9 ? "9+" : getBadgeCount(link.href)}
                  </Badge>
                ) : null}
                <LinkIndicator active={isActive(link.href)} />
              </Link>
            </div>
          ))}

          {/* Gestion dropdown */}
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setGestionHover(true)}
            onMouseLeave={() => setGestionHover(false)}
          >
            <button
              onClick={() => setGestionHover(!gestionHover)}
              style={linkStyle(
                gestionLinks.some((l) => isActive(l.href)),
              )}
            >
              Gestion
              <ChevronDown
                style={{
                  width: 12,
                  height: 12,
                  transition: "transform 150ms ease-out",
                  transform: gestionHover ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
              <LinkIndicator
                active={gestionLinks.some((l) => isActive(l.href))}
              />
            </button>
            {gestionHover && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#303030",
                  borderRadius: "var(--r-md)",
                  padding: "4px 0",
                  minWidth: "180px",
                  zIndex: 60,
                  boxShadow: "rgb(153, 153, 153) 1px 1px 1px 0px",
                }}
              >
                {gestionLinks.map((sub) => (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={() => setGestionHover(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      letterSpacing: "0.13px",
                      color: isActive(sub.href) ? "#DA291C" : "#FFFFFF",
                      textDecoration: "none",
                      padding: "8px 16px",
                      transition: "color 150ms ease-out",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(sub.href))
                        e.currentTarget.style.color = "#DA291C";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(sub.href))
                        e.currentTarget.style.color = "#FFFFFF";
                    }}
                  >
                    {sub.label}
                    {getBadgeCount(sub.href) ? (
                      <Badge variant="info" style={{ fontSize: "9px", padding: "2px 6px" }}>
                        {getBadgeCount(sub.href)! > 9 ? "9+" : getBadgeCount(sub.href)}
                      </Badge>
                    ) : null}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <div
          className="md:hidden"
          style={{
            display: isMobile ? "flex" : "none",
            justifyContent: "center",
            padding: "0 24px 12px",
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
            style={{
              background: "none",
              border: "none",
              color: "#FFFFFF",
              cursor: "pointer",
              padding: "8px",
            }}
          >
            <Menu style={{ width: 20, height: 20 }} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000000",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
          }}
        >
          {/* Close button */}
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
                padding: "8px",
              }}
            >
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>

          {/* Mobile logo */}
          <div style={{ textAlign: "center", padding: "12px 0 24px" }}>
            <Link
              href="/"
              onClick={closeMobile}
              style={{
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "#FFFFFF",
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
              }}
            >
              Fraude<span style={{ color: "#DA291C" }}>·</span>Ary
            </Link>
          </div>

          {/* Mobile links */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0,
              padding: "0 24px",
            }}
          >
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobile}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontFamily: "var(--font-sans)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: isActive(link.href) ? "#DA291C" : "#FFFFFF",
                  textDecoration: "none",
                  padding: "16px 0",
                  width: "100%",
                  textAlign: "center",
                  borderBottom: "1px solid #222222",
                }}
              >
                {link.label}
                {getBadgeCount(link.href) ? (
                  <Badge variant="info" style={{ fontSize: "9px", padding: "2px 6px" }}>
                    {getBadgeCount(link.href)! > 9 ? "9+" : getBadgeCount(link.href)}
                  </Badge>
                ) : null}
              </Link>
            ))}

            {/* Mobile Gestion expand */}
            <button
              onClick={() => setMobileGestionOpen(!mobileGestionOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontFamily: "var(--font-sans)",
                fontSize: "1rem",
                fontWeight: 600,
                color: gestionLinks.some((l) => isActive(l.href))
                  ? "#DA291C"
                  : "#FFFFFF",
                background: "none",
                border: "none",
                borderBottom: "1px solid #222222",
                padding: "16px 0",
                width: "100%",
                cursor: "pointer",
              }}
            >
              Gestion
              <ChevronDown
                style={{
                  width: 14,
                  height: 14,
                  transition: "transform 150ms ease-out",
                  transform: mobileGestionOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {mobileGestionOpen && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "100%",
                  background: "#0D0D0D",
                }}
              >
                {gestionLinks.map((sub) => (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={closeMobile}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.9375rem",
                      fontWeight: 500,
                      color: isActive(sub.href) ? "#DA291C" : "#FFFFFF",
                      textDecoration: "none",
                      padding: "14px 0",
                      width: "100%",
                      textAlign: "center",
                      borderBottom: "1px solid #1A1A1A",
                    }}
                  >
                    {sub.label}
                    {getBadgeCount(sub.href) ? (
                      <Badge variant="info" style={{ fontSize: "9px", padding: "2px 6px" }}>
                        {getBadgeCount(sub.href)! > 9 ? "9+" : getBadgeCount(sub.href)}
                      </Badge>
                    ) : null}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Mobile user area */}
          <div
            style={{
              marginTop: 24,
              padding: "16px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
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
                gap: "8px",
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
