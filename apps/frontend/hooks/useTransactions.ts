"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { Transaction, PaginatedResponse } from "@/types";

export function useTransactions(limit = 50, offset = 0) {
  const queryClient = useQueryClient();

  const query = useQuery<PaginatedResponse<Transaction>>({
    queryKey: ["transactions", limit, offset],
    queryFn: () =>
      fetchApi<PaginatedResponse<Transaction>>(
        `/api/v1/transactions?limit=${limit}&offset=${offset}`
      ),
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

  const createTransaction = useMutation({
    mutationFn: async (data: Omit<Transaction, "id" | "user_email" | "created_at" | "exchange_rate" | "total_invested"> & { exchange_rate?: number; total_invested?: number }) => {
      return fetchApi<Transaction>("/api/v1/transactions", {
        method: "POST",
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
    data: query.data?.data,
    total: query.data?.total || 0,
    limit: query.data?.limit || limit,
    offset: query.data?.offset || offset,
    isLoading: query.isLoading,
    error: query.error,
    updateTransaction: updateTransaction.mutate,
    createTransaction: createTransaction.mutate,
    deleteTransaction: deleteTransaction.mutate,
    isUpdating: updateTransaction.isPending,
    isCreating: createTransaction.isPending,
    isDeleting: deleteTransaction.isPending,
  };
}
