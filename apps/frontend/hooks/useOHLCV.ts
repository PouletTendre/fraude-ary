"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { OHLCVResponse } from "@/types";

export function useOHLCV(symbol: string, period: string, interval: string) {
  return useQuery<OHLCVResponse>({
    queryKey: ["ohlcv", symbol, period, interval],
    queryFn: () =>
      fetchApi<OHLCVResponse>(
        `/api/v1/technical/ohlcv?symbol=${encodeURIComponent(symbol)}&period=${period}&interval=${interval}`
      ),
    enabled: !!symbol && !!localStorage.getItem("token"),
    staleTime: 5 * 60 * 1000,
  });
}
