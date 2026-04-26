"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { NewsItem } from "@/types";

interface NewsResponse {
  symbol: string;
  items: NewsItem[];
}

export function useNews(symbol: string, limit: number = 10) {
  return useQuery<NewsResponse>({
    queryKey: ["news", symbol],
    queryFn: () => fetchApi<NewsResponse>(`/api/v1/news?symbol=${encodeURIComponent(symbol)}&limit=${limit}`),
    enabled: !!symbol && !!localStorage.getItem("token"),
    staleTime: 15 * 60 * 1000,
  });
}
