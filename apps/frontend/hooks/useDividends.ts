"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { Dividend, DividendSummary } from "@/types";

export function useDividends() {
  const queryClient = useQueryClient();

  const query = useQuery<Dividend[]>({
    queryKey: ["dividends"],
    queryFn: () => fetchApi<Dividend[]>("/api/v1/dividends"),
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });

  const summary = useQuery<DividendSummary>({
    queryKey: ["dividends", "summary"],
    queryFn: () => fetchApi<DividendSummary>("/api/v1/dividends/summary"),
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });

  const createDividend = useMutation({
    mutationFn: async (data: { symbol: string; amount_per_share: number; quantity: number; currency?: string; date: string }) => {
      return fetchApi<Dividend>("/api/v1/dividends", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dividends"], refetchType: "active" });
    },
  });

  const deleteDividend = useMutation({
    mutationFn: async (id: string) => {
      return fetchApi<void>(`/api/v1/dividends/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dividends"], refetchType: "active" });
    },
  });

  return {
    data: query.data,
    summary: summary.data,
    isLoading: query.isLoading,
    isLoadingSummary: summary.isLoading,
    error: query.error,
    createDividend: createDividend.mutate,
    deleteDividend: deleteDividend.mutate,
    isCreating: createDividend.isPending,
    isDeleting: deleteDividend.isPending,
  };
}
