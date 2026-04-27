"use client";

import { useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { OHLCVPoint } from "@/types";

import { createChart, ColorType, CrosshairMode, LineStyle, type IChartApi, type ISeriesApi, type Time } from "lightweight-charts";

interface MarketChartProps {
  data: OHLCVPoint[];
  type?: "candle" | "line" | "area";
  showVolume?: boolean;
  showSMA20?: boolean;
  showSMA50?: boolean;
  showBollinger?: boolean;
  height?: number;
  className?: string;
}

function computeSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i < period - 1) {
      result.push(null);
    } else {
      if (i >= period) sum -= data[i - period];
      result.push(sum / period);
    }
  }
  return result;
}

interface CandleOhlcv {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface LinePoint {
  time: Time;
  value: number;
}

interface VolumePoint {
  time: Time;
  value: number;
  color: string;
}

export function MarketChart({
  data,
  type = "candle",
  showVolume = true,
  showSMA20 = false,
  showSMA50 = false,
  showBollinger = false,
  height = 500,
  className,
}: MarketChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const chartData = useMemo(() => {
    return data.map((d) => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
  }, [data]);

  const closePrices = useMemo(() => data.map((d) => d.close), [data]);

  const sma20 = useMemo(() => (showSMA20 ? computeSMA(closePrices, 20) : null), [closePrices, showSMA20]);
  const sma50 = useMemo(() => (showSMA50 ? computeSMA(closePrices, 50) : null), [closePrices, showSMA50]);
  const bollinger = useMemo(() => {
    if (!showBollinger) return null;
    const sma = computeSMA(closePrices, 20);
    const upper: (number | null)[] = [];
    const lower: (number | null)[] = [];
    for (let i = 0; i < closePrices.length; i++) {
      if (i < 19) {
        upper.push(null);
        lower.push(null);
        continue;
      }
      const slice = closePrices.slice(i - 19, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / 20;
      const variance = slice.reduce((sum, val) => sum + (val - mean) ** 2, 0) / 20;
      const std = Math.sqrt(variance);
      upper.push(mean + 2 * std);
      lower.push(mean - 2 * std);
    }
    return { sma, upper, lower };
  }, [closePrices, showBollinger]);

  const volumeData = useMemo(() => {
    if (!showVolume) return null;
    return data.map((d, i) => ({
      time: d.time as Time,
      value: d.volume,
      color: i > 0 && d.close >= data[i - 1].close
        ? "rgba(16,185,129,0.3)"
        : "rgba(239,68,68,0.3)",
    }));
  }, [data, showVolume]);

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

    // Main series
    let mainSeries: ISeriesApi<"Candlestick" | "Line" | "Area">;

    if (type === "candle") {
      const candleSeries = chart.addCandlestickSeries({
        upColor: "#10B981",
        downColor: "#EF4444",
        borderUpColor: "#10B981",
        borderDownColor: "#EF4444",
        wickUpColor: "#10B981",
        wickDownColor: "#EF4444",
      });
      candleSeries.setData(chartData as CandleOhlcv[]);
      mainSeries = candleSeries;

      // Volume on separate pane
      if (volumeData) {
        const volumePane = chart.addHistogramSeries({
          priceFormat: { type: "volume" },
          priceScaleId: "",
        });
        volumePane.setData(volumeData as VolumePoint[]);
        volumePane.priceScale().applyOptions({
          scaleMargins: { top: 0.9, bottom: 0 },
        });
      }
    } else if (type === "line") {
      const lineSeries = chart.addLineSeries({
        color: "#6366F1",
        lineWidth: 2,
      });
      const lineData: LinePoint[] = data.map((d) => ({ time: d.time as Time, value: d.close }));
      lineSeries.setData(lineData);
      mainSeries = lineSeries;
    } else if (type === "area") {
      const areaSeries = chart.addAreaSeries({
        lineColor: "#6366F1",
        topColor: "rgba(99,102,241,0.3)",
        bottomColor: "rgba(99,102,241,0.02)",
        lineWidth: 2,
      });
      const areaData: LinePoint[] = data.map((d) => ({ time: d.time as Time, value: d.close }));
      areaSeries.setData(areaData);
      mainSeries = areaSeries;
    } else {
      // Fallback to candle
      const candleSeries = chart.addCandlestickSeries({
        upColor: "#10B981",
        downColor: "#EF4444",
        borderUpColor: "#10B981",
        borderDownColor: "#EF4444",
        wickUpColor: "#10B981",
        wickDownColor: "#EF4444",
      });
      candleSeries.setData(chartData as CandleOhlcv[]);
      mainSeries = candleSeries;
    }

    // SMA 20 overlay
    if (showSMA20 && sma20) {
      const sma20Series = chart.addLineSeries({
        color: "#F59E0B",
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
      });
      const sma20Data: LinePoint[] = sma20
        .map((v, i) => (v !== null ? { time: data[i].time as Time, value: v } : null))
        .filter(Boolean) as LinePoint[];
      sma20Series.setData(sma20Data);
    }

    // SMA 50 overlay
    if (showSMA50 && sma50) {
      const sma50Series = chart.addLineSeries({
        color: "#22D3EE",
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
      });
      const sma50Data: LinePoint[] = sma50
        .map((v, i) => (v !== null ? { time: data[i].time as Time, value: v } : null))
        .filter(Boolean) as LinePoint[];
      sma50Series.setData(sma50Data);
    }

    // Bollinger Bands
    if (showBollinger && bollinger) {
      // Upper band
      const upperSeries = chart.addLineSeries({
        color: "#A78BFA",
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
      });
      const upperData: LinePoint[] = bollinger.upper
        .map((v, i) => (v !== null ? { time: data[i].time as Time, value: v } : null))
        .filter(Boolean) as LinePoint[];
      upperSeries.setData(upperData);

      // Middle (SMA 20)
      const middleSeries = chart.addLineSeries({
        color: "#F59E0B",
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
      });
      const middleData: LinePoint[] = bollinger.sma
        .map((v, i) => (v !== null ? { time: data[i].time as Time, value: v } : null))
        .filter(Boolean) as LinePoint[];
      middleSeries.setData(middleData);

      // Lower band
      const lowerSeries = chart.addLineSeries({
        color: "#A78BFA",
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
      });
      const lowerData: LinePoint[] = bollinger.lower
        .map((v, i) => (v !== null ? { time: data[i].time as Time, value: v } : null))
        .filter(Boolean) as LinePoint[];
      lowerSeries.setData(lowerData);
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
  }, [data, type, showVolume, showSMA20, showSMA50, showBollinger, height, chartData, volumeData, sma20, sma50, bollinger]);

  if (data.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center text-text-tertiary", className)}
        style={{ height, background: "var(--surface-raised)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}
      >
        <p className="text-sm">Aucune donnée disponible</p>
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
