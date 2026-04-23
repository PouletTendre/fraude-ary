"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { Asset } from "@/types";

export function useAssets() {
  const queryClient = useQueryClient();

  const { data: assets, isLoading, error } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: () => fetchApi<Asset[]>("/assets"),
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });

  const createAsset = useMutation({
    mutationFn: async (asset: Omit<Asset, "id" | "user_id" | "current_price">) => {
      return fetchApi<Asset>("/assets", {
        method: "POST",
        body: JSON.stringify(asset),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  const updateAsset = useMutation({
    mutationFn: async ({ id, ...asset }: Asset) => {
      return fetchApi<Asset>(`/assets/${id}`, {
        method: "PUT",
        body: JSON.stringify(asset),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: number) => {
      return fetchApi<void>(`/assets/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  return {
    assets: assets || [],
    isLoading,
    error,
    createAsset: createAsset.mutate,
    updateAsset: updateAsset.mutate,
    deleteAsset: deleteAsset.mutate,
    isCreating: createAsset.isPending,
    isUpdating: updateAsset.isPending,
    isDeleting: deleteAsset.isPending,
  };
}