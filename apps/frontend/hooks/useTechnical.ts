"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { TechnicalIndicators } from "@/types";

export function useTechnical(symbol: string) {
  return useQuery<TechnicalIndicators>({
    queryKey: ["technical", symbol],
    queryFn: () => fetchApi<TechnicalIndicators>(`/api/v1/technical/indicators?symbol=${encodeURIComponent(symbol)}`),
    enabled: !!symbol && !!localStorage.getItem("token"),
    staleTime: 5 * 60 * 1000,
  });
}
