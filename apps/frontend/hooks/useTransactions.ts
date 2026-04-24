"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { Transaction } from "@/types";

export function useTransactions() {
  const queryClient = useQueryClient();

  const query = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: () => fetchApi<Transaction[]>("/api/v1/transactions"),
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Transaction> & { id: string }) => {
      return fetchApi<Transaction>(`/api/v1/transactions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"], refetchType: "active" });
      queryClient.invalidateQueries({ queryKey: ["portfolio"], refetchType: "active" });
      queryClient.invalidateQueries({ queryKey: ["assets"], refetchType: "active" });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      return fetchApi<void>(`/api/v1/transactions/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"], refetchType: "active" });
      queryClient.invalidateQueries({ queryKey: ["portfolio"], refetchType: "active" });
      queryClient.invalidateQueries({ queryKey: ["assets"], refetchType: "active" });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateTransaction: updateTransaction.mutate,
    deleteTransaction: deleteTransaction.mutate,
    isUpdating: updateTransaction.isPending,
    isDeleting: deleteTransaction.isPending,
  };
}
