"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { Transaction } from "@/types";

export function useTransactions() {
  return useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: () => fetchApi<Transaction[]>("/api/v1/transactions"),
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });
}
