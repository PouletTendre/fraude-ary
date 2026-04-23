"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { PriceAlert } from "@/types";

export interface CreateAlertData {
  symbol: string;
  target_price: number;
  condition: "above" | "below";
}

export function useAlerts() {
  const queryClient = useQueryClient();

  const { data: alerts, isLoading, error } = useQuery<PriceAlert[]>({
    queryKey: ["alerts"],
    queryFn: () => fetchApi<PriceAlert[]>("/api/v1/alerts"),
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });

  const createAlert = useMutation({
    mutationFn: async (data: CreateAlertData) => {
      return fetchApi<PriceAlert>("/api/v1/alerts", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const toggleAlert = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return fetchApi<PriceAlert>(`/api/v1/alerts/${id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const deleteAlert = useMutation({
    mutationFn: async (id: number) => {
      return fetchApi<void>(`/api/v1/alerts/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  return {
    alerts: alerts || [],
    isLoading,
    error,
    createAlert: createAlert.mutate,
    toggleAlert: toggleAlert.mutate,
    deleteAlert: deleteAlert.mutate,
    isCreating: createAlert.isPending,
    isToggling: toggleAlert.isPending,
    isDeleting: deleteAlert.isPending,
  };
}
