"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { OHLCVResponse } from "@/types";

export function useBenchmark(period: string = "1M") {
  const periodMap: Record<string, string> = {
    "1D": "5d",
    "1W": "5d",
    "1M": "1mo",
    "3M": "3mo",
    "1Y": "1y",
    ALL: "2y",
  };

  const apiPeriod = periodMap[period] || "1mo";

  const { data, isLoading, error } = useQuery<OHLCVResponse>({
    queryKey: ["benchmark", "SPY", apiPeriod],
    queryFn: () =>
      fetchApi<OHLCVResponse>(
        `/api/v1/technical/ohlcv?symbol=SPY&period=${apiPeriod}&interval=1d`
      ),
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
    staleTime: 5 * 60 * 1000,
  });

  const history =
    data?.data?.map((p) => ({
      date: new Date(p.time * 1000).toISOString().split("T")[0],
      value: p.close,
    })) ?? [];

  return {
    benchmarkHistory: history,
    isLoading,
    error,
  };
}
