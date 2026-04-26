"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { PortfolioAnalytics } from "@/types";

export function usePortfolioAnalytics() {
  return useQuery<PortfolioAnalytics>({
    queryKey: ["portfolio", "analytics"],
    queryFn: () => fetchApi<PortfolioAnalytics>("/api/v1/portfolio/analytics/summary"),
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
    staleTime: 5 * 60 * 1000,
  });
}
