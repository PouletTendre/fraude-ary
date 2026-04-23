"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { fetchApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  LayoutDashboard,
  Wallet,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Bell,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/assets", label: "Assets", icon: Wallet },
  { href: "/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/notifications", label: "Notifications", icon: Bell },
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
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchApi("/api/v1/prices/refresh", { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["assets"] });
      await queryClient.invalidateQueries({ queryKey: ["portfolio"] });
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700 transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "w-16" : "w-64",
          "transform -translate-x-full md:translate-x-0",
          mobileMenuOpen && "translate-x-0"
        )}
      >
        <div
          className={cn(
            "p-6 flex items-center justify-between",
            isSidebarCollapsed && "p-4 justify-center"
          )}
        >
          {!isSidebarCollapsed && (
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Fraude-Ary
            </h1>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className={cn("px-4 space-y-1", isSidebarCollapsed && "px-2")}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative",
                  isSidebarCollapsed && "justify-center px-2",
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
                {item.href === "/notifications" && unreadCount > 0 && (
                  <span
                    className={cn(
                      "flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full",
                      isSidebarCollapsed ? "absolute -top-1 -right-1 w-4 h-4 text-[10px]" : "ml-auto w-5 h-5"
                    )}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );

            if (isSidebarCollapsed) {
              return (
                <Tooltip key={item.href} content={item.label} position="right">
                  {linkContent}
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        <div className={cn("px-4 mt-2", isSidebarCollapsed && "px-2")}>
          {isSidebarCollapsed ? (
            <Tooltip content="Refresh Prices" position="right">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={cn(
                  "flex items-center justify-center w-full px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                  isRefreshing && "opacity-50 cursor-not-allowed"
                )}
              >
                <RefreshCw
                  className={cn("w-5 h-5", isRefreshing && "animate-spin")}
                />
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                isRefreshing && "opacity-50 cursor-not-allowed"
              )}
            >
              <RefreshCw
                className={cn("w-5 h-5", isRefreshing && "animate-spin")}
              />
              <span className="font-medium">
                {isRefreshing ? "Refreshing..." : "Refresh Prices"}
              </span>
            </button>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div
            className={cn(
              "px-4 py-2",
              isSidebarCollapsed && "px-0 text-center"
            )}
          >
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {isSidebarCollapsed
                ? user?.full_name?.charAt(0) || "U"
                : user?.full_name || "User"}
            </p>
            {!isSidebarCollapsed && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
            )}
          </div>
          {isSidebarCollapsed ? (
            <Tooltip content="Sign Out" position="right">
              <button
                onClick={logout}
                className="w-full mt-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors text-center"
              >
                ⇥
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={logout}
              className="w-full mt-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
            >
              Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            )}
          </button>
          <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400">
            Fraude-Ary
          </h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <main
        className={cn(
          "transition-all duration-300 min-h-screen",
          isSidebarCollapsed ? "md:ml-16" : "md:ml-64",
          "pt-16 md:pt-0 px-4 py-6 md:p-8"
        )}
      >
        {children}
      </main>
    </div>
  );
}
