"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { PortfolioSummary, PortfolioAnalytics } from "@/types";

export function usePortfolio() {
  const { data, isLoading, error } = useQuery<PortfolioSummary>({
    queryKey: ["portfolio"],
    queryFn: () => fetchApi<PortfolioSummary>("/api/v1/portfolio/summary"),
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });

  const {
    data: analytics,
    isLoading: isAnalyticsLoading,
  } = useQuery<PortfolioAnalytics>({
    queryKey: ["portfolio", "analytics"],
    queryFn: () => fetchApi<PortfolioAnalytics>("/api/v1/portfolio/analytics/summary"),
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });

  return {
    portfolio: data,
    analytics,
    isLoading: isLoading || isAnalyticsLoading,
    error,
  };
}