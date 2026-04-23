"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { fetchApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { LayoutDashboard, Wallet, RefreshCw, ChevronLeft, ChevronRight, Activity } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/assets", label: "Assets", icon: Wallet },
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <aside className={cn(
        "fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700 transition-all duration-300",
        isSidebarCollapsed ? "w-16" : "w-64",
        "transform -translate-x-full md:translate-x-0",
        mobileMenuOpen && "translate-x-0"
      )}>
        <div className={cn("p-6 flex items-center justify-between", isSidebarCollapsed && "p-4 justify-center")}>
          {!isSidebarCollapsed && (
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Fraude-Ary
            </h1>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        <nav className={cn("px-4 space-y-2", isSidebarCollapsed && "px-2")}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isSidebarCollapsed && "justify-center px-2",
                pathname === item.href
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className={cn("px-4 mt-4", isSidebarCollapsed && "px-2")}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
              isSidebarCollapsed && "justify-center px-2",
              isRefreshing && "opacity-50 cursor-not-allowed"
            )}
          >
            <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
            {!isSidebarCollapsed && <span className="font-medium">{isRefreshing ? "Refreshing..." : "Refresh Prices"}</span>}
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className={cn("px-4 py-2", isSidebarCollapsed && "px-0 text-center")}>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {isSidebarCollapsed ? user?.full_name?.charAt(0) || "U" : (user?.full_name || "User")}
            </p>
            {!isSidebarCollapsed && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
            )}
          </div>
          <button
            onClick={logout}
            className={cn(
              "w-full mt-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors text-left",
              isSidebarCollapsed && "px-0 justify-center"
            )}
          >
            {!isSidebarCollapsed ? "Sign Out" : "⇥"}
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <main className={cn("transition-all duration-300 md:p-8", isSidebarCollapsed ? "md:ml-16 p-4" : "md:ml-64 p-4")}>{children}</main>
    </div>
  );
}