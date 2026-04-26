"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { ValuationResponse } from "@/types";

export function useValuation(symbol: string) {
  return useQuery<ValuationResponse>({
    queryKey: ["valuation", symbol],
    queryFn: () => fetchApi<ValuationResponse>(`/api/v1/valuation/${encodeURIComponent(symbol)}`),
    enabled: !!symbol && !!localStorage.getItem("token"),
    staleTime: 15 * 60 * 1000,
  });
}
