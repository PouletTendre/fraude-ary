"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  type IChartApi,
  type Time,
} from "lightweight-charts";

interface BenchmarkPoint {
  date: string;
  value: number;
}

interface DashboardAreaChartProps {
  portfolioHistory: { date: string; value: number }[];
  benchmarkHistory: BenchmarkPoint[];
  period: string;
  totalGainLoss: number;
  gainLossPercent: number;
  onPeriodChange: (period: string) => void;
  className?: string;
}

const PERIODS = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

export function DashboardAreaChart({
  portfolioHistory,
  benchmarkHistory,
  period,
  totalGainLoss,
  gainLossPercent,
  onPeriodChange,
  className,
}: DashboardAreaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || portfolioHistory.length === 0) return;

    const container = containerRef.current;
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#62666d",
      },
      width: container.clientWidth,
      height: 380,
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.08)", width: 1, style: 2 },
        horzLine: { color: "rgba(255,255,255,0.08)", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.05)",
        scaleMargins: { top: 0.15, bottom: 0.05 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.05)",
        timeVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: false,
      handleScale: false,
    });

    chartRef.current = chart;

    // Portfolio area series
    const portfolioData = portfolioHistory.map((d) => ({
      time: (new Date(d.date).getTime() / 1000) as Time,
      value: d.value,
    }));

    const areaSeries = chart.addAreaSeries({
      lineColor: "#5e6ad2",
      topColor: "rgba(94,106,210,0.25)",
      bottomColor: "rgba(94,106,210,0.02)",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    areaSeries.setData(portfolioData);

    // Benchmark line series
    if (benchmarkHistory.length > 0) {
      const benchmarkData = benchmarkHistory.map((d) => ({
        time: (new Date(d.date).getTime() / 1000) as Time,
        value: d.value,
      }));

      // Normalize benchmark to same starting value as portfolio for visual comparison
      if (portfolioData.length > 0 && benchmarkData.length > 0) {
        const pfStart = portfolioData[0].value;
        const bmStart = benchmarkData[0].value;
        if (bmStart > 0) {
          const ratio = pfStart / bmStart;
          const normalized = benchmarkData.map((d) => ({
            ...d,
            value: (d.value as number) * ratio,
          }));
          const benchLine = chart.addLineSeries({
            color: "rgba(255,255,255,0.15)",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          benchLine.setData(normalized);
        }
      }
    }

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w } = entry.contentRect;
        if (w > 0) chart.resize(w, 380);
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [portfolioHistory, benchmarkHistory]);

  const isPositive = gainLossPercent >= 0;

  return (
    <div
      className={className}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-panel)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "20px 24px 0",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 510,
              color: "var(--text-tertiary)",
              margin: "0 0 4px",
              textTransform: "uppercase",
              letterSpacing: "0.6px",
            }}
          >
            Portfolio
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <span
              className="font-tnum"
              style={{
                fontSize: "28px",
                fontWeight: 400,
                color: "var(--text-primary)",
                letterSpacing: "-0.34px",
              }}
            >
              {new Intl.NumberFormat("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(portfolioHistory[portfolioHistory.length - 1]?.value ?? 0)}
              {" €"}
            </span>
            <span
              className="font-tnum"
              style={{
                fontSize: "14px",
                fontWeight: 510,
                color: isPositive ? "var(--gain)" : "var(--loss)",
              }}
            >
              {isPositive ? "▲" : "▼"}{" "}
              {gainLossPercent.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Benchmark legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#5e6ad2",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
              Portfolio
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "10px",
                height: "2px",
                borderRadius: "1px",
                background: "rgba(255,255,255,0.3)",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
              SPY
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div ref={containerRef} style={{ width: "100%", marginTop: "8px" }} />

      {/* Period chips */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "4px",
          padding: "12px 24px 20px",
        }}
      >
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            style={{
              padding: "5px 14px",
              borderRadius: "var(--r-full)",
              fontSize: "12px",
              fontWeight: 510,
              border: "none",
              cursor: "pointer",
              background:
                period === p ? "var(--primary-muted)" : "transparent",
              color:
                period === p ? "var(--primary)" : "var(--text-tertiary)",
              transition: "all 150ms ease-out",
            }}
            onMouseEnter={(e) => {
              if (period !== p) {
                e.currentTarget.style.background = "var(--surface-hover)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }
            }}
            onMouseLeave={(e) => {
              if (period !== p) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-tertiary)";
              }
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
