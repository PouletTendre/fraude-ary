"use client";

import { useEffect, useState, ForwardRefExoticComponent, RefAttributes } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useAlerts } from "@/hooks/useAlerts";
import { fetchApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  BarChart3,
  Bell,
  ArrowLeftRight,
  DollarSign,
  Settings,
  RefreshCw,
  BookOpen,
  Menu,
  X,
  PieChart,
  Calculator,
  LucideProps,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  badge?: number | string;
}

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "Principal",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/portfolio", label: "Portefeuille", icon: Wallet },
      { href: "/assets", label: "Marchés", icon: TrendingUp },
      { href: "/journal", label: "Analyse", icon: BarChart3 },
      { href: "/diversification", label: "Diversification", icon: PieChart },
      { href: "/simulator", label: "Simulateur", icon: Calculator },
    ],
  },
  {
    label: "Gestion",
    items: [
      { href: "/alerts", label: "Alertes", icon: Bell },
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/journal", label: "Transactions", icon: ArrowLeftRight },
      { href: "/dividends", label: "Dividendes", icon: DollarSign },
      { href: "/settings", label: "Paramètres", icon: Settings },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { alerts } = useAlerts();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeAlertCount = alerts.filter((a) => a.is_active).length;

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "100vh", background: "var(--bg)" }}
      >
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex" style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky md:top-0 z-50 flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{
          width: "260px",
          background: "var(--surface-sunken)",
          borderRight: "1px solid var(--border)",
          padding: "24px 12px",
          gap: "2px",
          height: "100vh",
        }}
      >
        {/* Close button for mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden absolute top-4 right-4 p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div
          style={{
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
            padding: "8px 12px 20px",
            borderBottom: "1px solid var(--border)",
            marginBottom: "8px",
          }}
        >
          Fraude<span style={{ color: "var(--primary-hover)" }}>·Ary</span>
        </div>

        {navSections.map((section) => (
          <div key={section.label}>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                padding: "12px 12px 6px",
              }}
            >
              {section.label}
            </div>
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-[10px] cursor-pointer transition-all duration-150 ease-out no-underline",
                    isActive
                      ? "text-primary-hover"
                      : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                  )}
                  style={{
                    padding: "9px 12px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 500,
                    borderLeft: isActive ? "2px solid var(--primary)" : "2px solid transparent",
                    paddingLeft: isActive ? "10px" : "12px",
                    background: isActive ? "var(--primary-subtle)" : undefined,
                  }}
                >
                  <item.icon
                    className="flex-shrink-0"
                    style={{ width: "16px", height: "16px" }}
                  />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-auto">
                      <Badge variant="loss" style={{ fontSize: "9px", padding: "2px 6px" }}>
                        {item.badge}
                      </Badge>
                    </span>
                  )}
                  {item.href === "/alerts" && activeAlertCount > 0 && (
                    <span className="ml-auto">
                      <Badge variant="loss" style={{ fontSize: "9px", padding: "2px 6px" }}>
                        {activeAlertCount > 9 ? "9+" : activeAlertCount}
                      </Badge>
                    </span>
                  )}
                  {item.href === "/notifications" && unreadCount > 0 && !item.badge && (
                    <span className="ml-auto">
                      <Badge variant="loss" style={{ fontSize: "9px", padding: "2px 6px" }}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-[10px] cursor-pointer transition-all duration-150 ease-out mt-2 text-text-secondary hover:bg-surface-raised hover:text-text-primary"
          style={{
            padding: "9px 12px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 500,
            borderLeft: "2px solid transparent",
            background: "transparent",
            border: "none",
            width: "100%",
          }}
        >
          <RefreshCw
            className={cn("flex-shrink-0", isRefreshing && "animate-spin")}
            style={{ width: "16px", height: "16px" }}
          />
          <span>Refresh Prices</span>
        </button>

        {/* User */}
        <div className="mt-auto pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <ThemeToggle />
          <div style={{ padding: "8px 12px" }}>
            <p className="text-[13px] font-medium text-text-primary truncate">
              {user?.full_name || "User"}
            </p>
            <p className="text-[11px] text-text-tertiary truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="w-full text-left text-[13px] text-text-secondary hover:text-text-primary hover:bg-surface-rounded transition-all duration-150 ease-out"
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              background: "transparent",
              border: "none",
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className="flex-1 flex flex-col"
        style={{ padding: "32px", gap: "32px", overflow: "auto" }}
      >
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-surface border border-border text-text-primary hover:bg-surface-raised transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}
