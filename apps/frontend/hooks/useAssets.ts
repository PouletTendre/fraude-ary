"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { Asset, PaginatedResponse } from "@/types";

export function useAssets(limit = 50, offset = 0) {
  const queryClient = useQueryClient();

  const { data: paginated, isLoading, error } = useQuery<PaginatedResponse<Asset>>({
    queryKey: ["assets", limit, offset],
    queryFn: () =>
      fetchApi<PaginatedResponse<Asset>>(
        `/api/v1/assets?limit=${limit}&offset=${offset}`
      ),
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });

  const createAsset = useMutation({
    mutationFn: async (asset: Omit<Asset, "id" | "user_id" | "current_price">) => {
      return fetchApi<Asset>("/api/v1/assets", {
        method: "POST",
        body: JSON.stringify(asset),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"], refetchType: "active" });
      queryClient.invalidateQueries({ queryKey: ["portfolio"], refetchType: "active" });
      queryClient.invalidateQueries({ queryKey: ["transactions"], refetchType: "active" });
    },
  });

  const updateAsset = useMutation({
    mutationFn: async ({ id, ...asset }: Partial<Asset> & { id: string }) => {
      return fetchApi<Asset>(`/api/v1/assets/${id}`, {
        method: "PUT",
        body: JSON.stringify(asset),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"], refetchType: "active" });
      queryClient.invalidateQueries({ queryKey: ["portfolio"], refetchType: "active" });
      queryClient.invalidateQueries({ queryKey: ["transactions"], refetchType: "active" });
    },
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      return fetchApi<void>(`/api/v1/assets/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"], refetchType: "active" });
      queryClient.invalidateQueries({ queryKey: ["portfolio"], refetchType: "active" });
      queryClient.invalidateQueries({ queryKey: ["transactions"], refetchType: "active" });
    },
  });

  const bulkDeleteAssets = useMutation({
    mutationFn: async (ids: string[]) => {
      return fetchApi<void>("/api/v1/assets/bulk-delete", {
        method: "POST",
        body: JSON.stringify(ids),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"], refetchType: "active" });
      queryClient.invalidateQueries({ queryKey: ["portfolio"], refetchType: "active" });
      queryClient.invalidateQueries({ queryKey: ["transactions"], refetchType: "active" });
    },
  });

  return {
    assets: paginated?.data || [],
    total: paginated?.total || 0,
    limit: paginated?.limit || limit,
    offset: paginated?.offset || offset,
    isLoading,
    error,
    createAsset: createAsset.mutate,
    updateAsset: updateAsset.mutate,
    deleteAsset: deleteAsset.mutate,
    bulkDeleteAssets: bulkDeleteAssets.mutate,
    isCreating: createAsset.isPending,
    isUpdating: updateAsset.isPending,
    isDeleting: deleteAsset.isPending,
    isBulkDeleting: bulkDeleteAssets.isPending,
  };
}