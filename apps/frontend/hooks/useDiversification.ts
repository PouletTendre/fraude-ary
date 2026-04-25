"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { DiversificationData } from "@/types";

export function useDiversification() {
  const queryClient = useQueryClient();

  const query = useQuery<DiversificationData>({
    queryKey: ["diversification"],
    queryFn: () => fetchApi<DiversificationData>("/api/v1/portfolio/diversification"),
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });

  const enrichAll = useMutation({
    mutationFn: async () => {
      return fetchApi<{ enriched: number; errors: string[] }>("/api/v1/assets/enrich-all", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diversification"], refetchType: "active" });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    enrichAll: enrichAll.mutate,
    isEnriching: enrichAll.isPending,
  };
}
