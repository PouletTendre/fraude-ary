"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

import { createChart, ColorType, CrosshairMode, type IChartApi, type Time } from "lightweight-charts";

interface PortfolioChartProps {
  data: { time: number; value: number }[];
  type?: "line" | "area";
  height?: number;
  className?: string;
}

interface ChartPoint {
  time: Time;
  value: number;
}

export function PortfolioChart({
  data,
  type = "line",
  height = 320,
  className,
}: PortfolioChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94A3B8",
      },
      width: containerRef.current.clientWidth,
      height,
      grid: {
        vertLines: { color: "#1E293B" },
        horzLines: { color: "#1E293B" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: "#1E293B",
      },
      timeScale: {
        borderColor: "#1E293B",
        timeVisible: true,
      },
    });

    chartRef.current = chart;

    const chartData: ChartPoint[] = data.map((d) => ({
      time: d.time as Time,
      value: d.value,
    }));

    if (type === "area") {
      const areaSeries = chart.addAreaSeries({
        lineColor: "#6366F1",
        topColor: "rgba(99,102,241,0.3)",
        bottomColor: "rgba(99,102,241,0.02)",
        lineWidth: 2,
      });
      areaSeries.setData(chartData);
    } else {
      const lineSeries = chart.addLineSeries({
        color: "#6366F1",
        lineWidth: 2,
      });
      lineSeries.setData(chartData);
    }

    chart.timeScale().fitContent();

    // ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w } = entry.contentRect;
        if (w > 0) {
          chart.resize(w, height);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [data, type, height]);

  if (data.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center text-text-tertiary", className)}
        style={{ height, background: "var(--surface-raised)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}
      >
        <p className="text-sm">Aucune donnée</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height }}
    />
  );
}
