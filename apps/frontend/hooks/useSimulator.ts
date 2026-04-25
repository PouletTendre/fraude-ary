"use client";
import { useState } from "react";
import { fetchApi } from "@/lib/api";
import type { SimulatorRequest, SimulatorResponse } from "@/types";

export function useSimulator() {
  const [data, setData] = useState<SimulatorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulate = async (params: SimulatorRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchApi<SimulatorResponse>("/api/v1/simulator/simulate", {
        method: "POST",
        body: JSON.stringify(params),
      });
      setData(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, simulate };
}
