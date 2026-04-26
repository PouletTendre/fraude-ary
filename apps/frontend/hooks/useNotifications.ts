"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { Notification } from "@/types";

export function useNotifications() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading, error } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => fetchApi<Notification[]>("/api/v1/notifications"),
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      return fetchApi<void>("/api/v1/notifications/read-all", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      return fetchApi<void>(`/api/v1/notifications/${id}/read`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return {
    notifications: notifications || [],
    isLoading,
    error,
    unreadCount,
    markAllAsRead: markAllAsRead.mutate,
    markAsRead: markAsRead.mutate,
    isMarkingAll: markAllAsRead.isPending,
    isMarkingOne: markAsRead.isPending,
  };
}
