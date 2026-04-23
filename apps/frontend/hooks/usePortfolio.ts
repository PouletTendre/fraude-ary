"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { PortfolioSummary } from "@/types";

export function usePortfolio() {
  const { data, isLoading, error } = useQuery<PortfolioSummary>({
    queryKey: ["portfolio"],
    queryFn: () => fetchApi<PortfolioSummary>("/api/v1/portfolio/summary"),
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });

  return {
    portfolio: data,
    isLoading,
    error,
  };
}