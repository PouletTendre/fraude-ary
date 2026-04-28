"use client";

import { useEffect, useRef, useMemo, useCallback } from "react";
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
  showRSI?: boolean;
  showMACD?: boolean;
  height?: number;
  className?: string;
  onLoadMore?: (earliestTime: number) => void;
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

function computeRSI(closePrices: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = new Array(closePrices.length).fill(null);
  if (closePrices.length <= period) return result;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = closePrices[i] - closePrices[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss -= change;
  }
  avgGain /= period;
  avgLoss /= period;

  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  // Wilder's smoothing
  for (let i = period + 1; i < closePrices.length; i++) {
    const change = closePrices[i] - closePrices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return result;
}

function computeEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(data.length).fill(null);
  if (data.length < period) return result;

  const k = 2 / (period + 1);

  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i];
  result[period - 1] = sum / period;

  for (let i = period; i < data.length; i++) {
    result[i] = data[i] * k + result[i - 1]! * (1 - k);
  }

  return result;
}

function computeMACD(closePrices: number[]): {
  macdLine: (number | null)[];
  signalLine: (number | null)[];
  histogram: (number | null)[];
} {
  const length = closePrices.length;
  const ema12 = computeEMA(closePrices, 12);
  const ema26 = computeEMA(closePrices, 26);

  const macdLine: (number | null)[] = new Array(length).fill(null);
  for (let i = 0; i < length; i++) {
    if (ema12[i] !== null && ema26[i] !== null) {
      macdLine[i] = ema12[i]! - ema26[i]!;
    }
  }

  const macdValues: number[] = [];
  const macdIndices: number[] = [];
  for (let i = 0; i < length; i++) {
    if (macdLine[i] !== null) {
      macdValues.push(macdLine[i]!);
      macdIndices.push(i);
    }
  }

  const ema9 = computeEMA(macdValues, 9);

  const signalLine: (number | null)[] = new Array(length).fill(null);
  for (let j = 0; j < macdIndices.length; j++) {
    if (ema9[j] !== null) {
      signalLine[macdIndices[j]] = ema9[j];
    }
  }

  const histogram: (number | null)[] = new Array(length).fill(null);
  for (let i = 0; i < length; i++) {
    if (macdLine[i] !== null && signalLine[i] !== null) {
      histogram[i] = macdLine[i]! - signalLine[i]!;
    }
  }

  return { macdLine, signalLine, histogram };
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
  showRSI = false,
  showMACD = false,
  height = 600,
  className,
  onLoadMore,
}: MarketChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<"Candlestick" | "Line" | "Area" | "Histogram"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const sma20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const sma50SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bollingerUpperRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bollingerMiddleRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bollingerLowerRef = useRef<ISeriesApi<"Line"> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdHistogramRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const macdSignalRef = useRef<ISeriesApi<"Line"> | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const earliestTimeRef = useRef<number>(Infinity);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

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

  const rsi = useMemo(() => (showRSI ? computeRSI(closePrices, 14) : null), [closePrices, showRSI]);

  const macd = useMemo(() => (showMACD ? computeMACD(closePrices) : null), [closePrices, showMACD]);

  const volumeData = useMemo(() => {
    if (!showVolume) return null;
    return data.map((d, i) => ({
      time: d.time as Time,
      value: d.volume,
      color: i > 0 && d.close >= data[i - 1].close
        ? "rgba(16,185,129,0.3)"
        : "rgba(248,81,73,0.3)",
    }));
  }, [data, showVolume]);

  // Create chart on mount / type change / overlay toggles
  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const prevChart = chartRef.current;
    if (prevChart) {
      prevChart.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8a8f98",
      },
      width: containerRef.current.clientWidth,
      height,
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.06)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.06)",
        timeVisible: true,
      },
    });

    chartRef.current = chart;
    earliestTimeRef.current = data.length > 0 ? data[0].time : Infinity;

    const hasSubPanes = showRSI || showMACD;
    let mainBottom = 0;
    let volTop = 0.9;
    let volBottom = 0;

    if (showRSI && showMACD) {
      mainBottom = 0.4;
      volTop = 0.5;
      volBottom = 0.4;
    } else if (showRSI || showMACD) {
      mainBottom = 0.2;
      volTop = 0.7;
      volBottom = 0.2;
    }

    if (hasSubPanes) {
      chart.priceScale("right").applyOptions({
        scaleMargins: { top: 0, bottom: mainBottom },
      });
    }

    // Zoom-back detection
    chart.timeScale().subscribeVisibleTimeRangeChange((range) => {
      if (!onLoadMoreRef.current || loadingMoreRef.current) return;
      if (!range) return;
      if ((range.from as number) < earliestTimeRef.current) {
        loadingMoreRef.current = true;
        Promise.resolve(onLoadMoreRef.current(earliestTimeRef.current))
          .finally(() => {
            loadingMoreRef.current = false;
          });
      }
    });

    // Add main series based on type
    if (type === "candle") {
      const candleSeries = chart.addCandlestickSeries({
        upColor: "#10b981",
        downColor: "#f85149",
        borderUpColor: "#10b981",
        borderDownColor: "#f85149",
        wickUpColor: "#10b981",
        wickDownColor: "#f85149",
      });
      candleSeries.setData(chartData as CandleOhlcv[]);
      mainSeriesRef.current = candleSeries;

      if (volumeData) {
        const volumePane = chart.addHistogramSeries({
          priceFormat: { type: "volume" },
          priceScaleId: "",
        });
        volumePane.setData(volumeData as VolumePoint[]);
        volumePane.priceScale().applyOptions({
          scaleMargins: { top: volTop, bottom: volBottom },
        });
        volumeSeriesRef.current = volumePane;
      }
    } else if (type === "line") {
      const lineSeries = chart.addLineSeries({
        color: "#5e6ad2",
        lineWidth: 2,
      });
      const lineData: LinePoint[] = data.map((d) => ({ time: d.time as Time, value: d.close }));
      lineSeries.setData(lineData);
      mainSeriesRef.current = lineSeries;
    } else if (type === "area") {
      const areaSeries = chart.addAreaSeries({
        lineColor: "#5e6ad2",
        topColor: "rgba(94,106,210,0.3)",
        bottomColor: "rgba(94,106,210,0.02)",
        lineWidth: 2,
      });
      const areaData: LinePoint[] = data.map((d) => ({ time: d.time as Time, value: d.close }));
      areaSeries.setData(areaData);
      mainSeriesRef.current = areaSeries;
    } else {
      const candleSeries = chart.addCandlestickSeries({
        upColor: "#10b981",
        downColor: "#f85149",
        borderUpColor: "#10b981",
        borderDownColor: "#f85149",
        wickUpColor: "#10b981",
        wickDownColor: "#f85149",
      });
      candleSeries.setData(chartData as CandleOhlcv[]);
      mainSeriesRef.current = candleSeries;
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
      sma20SeriesRef.current = sma20Series;
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
      sma50SeriesRef.current = sma50Series;
    }

    // Bollinger Bands
    if (showBollinger && bollinger) {
      const upperSeries = chart.addLineSeries({
        color: "#828fff",
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
      });
      const upperData: LinePoint[] = bollinger.upper
        .map((v, i) => (v !== null ? { time: data[i].time as Time, value: v } : null))
        .filter(Boolean) as LinePoint[];
      upperSeries.setData(upperData);
      bollingerUpperRef.current = upperSeries;

      const middleSeries = chart.addLineSeries({
        color: "#F59E0B",
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
      });
      const middleData: LinePoint[] = bollinger.sma
        .map((v, i) => (v !== null ? { time: data[i].time as Time, value: v } : null))
        .filter(Boolean) as LinePoint[];
      middleSeries.setData(middleData);
      bollingerMiddleRef.current = middleSeries;

      const lowerSeries = chart.addLineSeries({
        color: "#828fff",
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
      });
      const lowerData: LinePoint[] = bollinger.lower
        .map((v, i) => (v !== null ? { time: data[i].time as Time, value: v } : null))
        .filter(Boolean) as LinePoint[];
      lowerSeries.setData(lowerData);
      bollingerLowerRef.current = lowerSeries;
    }

    // RSI pane
    if (showRSI && rsi) {
      const rsiSeries = chart.addLineSeries({
        color: "#5e6ad2",
        lineWidth: 2,
        priceScaleId: "rsi",
      });
      const rsiData: LinePoint[] = rsi
        .map((v, i) => (v !== null ? { time: data[i].time as Time, value: v } : null))
        .filter(Boolean) as LinePoint[];
      rsiSeries.setData(rsiData);

      rsiSeries.priceScale().applyOptions({
        scaleMargins: showMACD
          ? { top: 0.6, bottom: 0.2 }
          : { top: 0.8, bottom: 0 },
        borderColor: "rgba(255,255,255,0.06)",
        borderVisible: false,
      });

      rsiSeries.createPriceLine({
        price: 70,
        color: "rgba(248,81,73,0.5)",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "70",
      });
      rsiSeries.createPriceLine({
        price: 30,
        color: "rgba(16,185,129,0.5)",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "30",
      });

      rsiSeriesRef.current = rsiSeries;
    }

    // MACD pane
    if (showMACD && macd) {
      const macdHistogramData: VolumePoint[] = macd.histogram
        .map((v, i) => ({
          time: data[i].time as Time,
          value: v !== null ? Math.abs(v) : 0,
          color: v !== null
            ? v >= 0
              ? "rgba(16,185,129,0.6)"
              : "rgba(248,81,73,0.6)"
            : "rgba(255,255,255,0)",
        }));

      const macdHistogramSeries = chart.addHistogramSeries({
        priceScaleId: "macd",
      });
      macdHistogramSeries.setData(macdHistogramData);

      macdHistogramSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
        borderColor: "rgba(255,255,255,0.06)",
        borderVisible: false,
      });

      macdHistogramSeries.createPriceLine({
        price: 0,
        color: "rgba(255,255,255,0.15)",
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: false,
      });

      macdHistogramRef.current = macdHistogramSeries;

      const macdSignalSeries = chart.addLineSeries({
        color: "#7170ff",
        lineWidth: 1,
        priceScaleId: "macd",
      });
      const macdSignalData: LinePoint[] = macd.signalLine
        .map((v, i) => (v !== null ? { time: data[i].time as Time, value: v } : null))
        .filter(Boolean) as LinePoint[];
      macdSignalSeries.setData(macdSignalData);
      macdSignalRef.current = macdSignalSeries;
    }

    // Set visible logical range (show last ~60 bars)
    const bars = Math.min(data.length, 60);
    chart.timeScale().setVisibleLogicalRange({ from: data.length - bars, to: data.length - 1 });

    // Crosshair tooltip
    const tooltipEl = document.createElement("div");
    tooltipEl.style.cssText =
      "position:absolute;display:none;pointer-events:none;z-index:100;background:var(--surface, #1a1a2e);border:1px solid var(--border, rgba(255,255,255,0.08));border-radius:var(--r-md, 8px);padding:8px 12px;font-size:12px;line-height:1.6;color:var(--text-primary, #e2e8f0);white-space:nowrap;font-family:inherit;";
    containerRef.current.appendChild(tooltipEl);
    tooltipRef.current = tooltipEl;

    chart.subscribeCrosshairMove((param) => {
      if (!param.point || !param.time) {
        tooltipEl.style.display = "none";
        return;
      }

      const timeNum = param.time as number;
      const timeStr = new Date(timeNum * 1000).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      let html = `<div style="color:#8a8f98;margin-bottom:4px;font-weight:600">${timeStr}</div>`;

      const candleSeriesData = mainSeriesRef.current ? param.seriesData.get(mainSeriesRef.current) : undefined;
      if (candleSeriesData && type === "candle") {
        const cd = candleSeriesData as unknown as Record<string, number>;
        html += `<div style="display:flex;gap:8px"><span>O: <b>${cd.open?.toFixed(2) ?? "-"}</b></span><span>H: <b>${cd.high?.toFixed(2) ?? "-"}</b></span><span>L: <b>${cd.low?.toFixed(2) ?? "-"}</b></span><span>C: <b>${cd.close?.toFixed(2) ?? "-"}</b></span></div>`;
      } else if (candleSeriesData) {
        const ld = candleSeriesData as { value?: number; close?: number };
        html += `<div>C: <b>${(ld.close ?? ld.value ?? 0).toFixed(2)}</b></div>`;
      }

      if (showVolume && volumeSeriesRef.current) {
        const volData = param.seriesData.get(volumeSeriesRef.current);
        if (volData) {
          const vd = volData as { value?: number };
          html += `<div style="color:#8a8f98">V: <b>${(vd.value ?? 0).toFixed(0)}</b></div>`;
        }
      }

      if (showRSI && rsiSeriesRef.current) {
        const rsiData = param.seriesData.get(rsiSeriesRef.current);
        if (rsiData) {
          const rd = rsiData as { value?: number };
          const rsiVal = rd.value ?? 0;
          const rsiColor = rsiVal > 70 ? "#f85149" : rsiVal < 30 ? "#10b981" : "#5e6ad2";
          html += `<div style="color:${rsiColor}">RSI: <b>${rsiVal.toFixed(1)}</b></div>`;
        }
      }

      if (showMACD && macdHistogramRef.current) {
        const macdData = param.seriesData.get(macdHistogramRef.current);
        const sigData = macdSignalRef.current ? param.seriesData.get(macdSignalRef.current) : undefined;
        if (macdData || sigData) {
          const md = macdData as { value?: number } | undefined;
          const sd = sigData as { value?: number } | undefined;
          const histVal = md?.value ?? 0;
          const sigVal = sd?.value ?? 0;
          const macdLineVal = histVal + sigVal;
          html += `<div style="color:#7170ff">MACD: <b>${macdLineVal.toFixed(4)}</b></div>`;
          if (sigData) {
            html += `<div style="color:#8a8f98">Signal: <b>${sigVal.toFixed(4)}</b></div>`;
          }
          html += `<div style="color:${histVal >= 0 ? "#10b981" : "#f85149"}">Hist: <b>${histVal.toFixed(4)}</b></div>`;
        }
      }

      tooltipEl.innerHTML = html;

      const rect = containerRef.current!.getBoundingClientRect();
      let x = param.point.x + 16;
      let y = param.point.y - 20;
      if (x + 200 > rect.width) x = param.point.x - 200;
      if (y < 0) y = param.point.y + 16;
      tooltipEl.style.left = `${x}px`;
      tooltipEl.style.top = `${y}px`;
      tooltipEl.style.display = "block";
    });

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
      if (tooltipRef.current) {
        tooltipRef.current.remove();
        tooltipRef.current = null;
      }
      chart.remove();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, height, showRSI, showMACD]);

  // Update data when data or overlays change (incremental, no chart recreate)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || data.length === 0) return;

    earliestTimeRef.current = data[0].time;

    const main = mainSeriesRef.current;
    if (type === "candle" && main) {
      main.setData(chartData as CandleOhlcv[]);
    } else if (type === "line" && main) {
      const lineData: LinePoint[] = data.map((d) => ({ time: d.time as Time, value: d.close }));
      main.setData(lineData);
    } else if (type === "area" && main) {
      const areaData: LinePoint[] = data.map((d) => ({ time: d.time as Time, value: d.close }));
      main.setData(areaData);
    } else if (main && type !== "candle" && type !== "line" && type !== "area") {
      main.setData(chartData as CandleOhlcv[]);
    }

    if (volumeSeriesRef.current && volumeData) {
      volumeSeriesRef.current.setData(volumeData as VolumePoint[]);
    }
    if (sma20SeriesRef.current && sma20) {
      const sma20Data: LinePoint[] = sma20
        .map((v, i) => (v !== null ? { time: data[i].time as Time, value: v } : null))
        .filter(Boolean) as LinePoint[];
      sma20SeriesRef.current.setData(sma20Data);
    }
    if (sma50SeriesRef.current && sma50) {
      const sma50Data: LinePoint[] = sma50
        .map((v, i) => (v !== null ? { time: data[i].time as Time, value: v } : null))
        .filter(Boolean) as LinePoint[];
      sma50SeriesRef.current.setData(sma50Data);
    }
    if (bollingerUpperRef.current && bollinger) {
      const upperData: LinePoint[] = bollinger.upper
        .map((v, i) => (v !== null ? { time: data[i].time as Time, value: v } : null))
        .filter(Boolean) as LinePoint[];
      bollingerUpperRef.current.setData(upperData);
    }
    if (bollingerMiddleRef.current && bollinger) {
      const middleData: LinePoint[] = bollinger.sma
        .map((v, i) => (v !== null ? { time: data[i].time as Time, value: v } : null))
        .filter(Boolean) as LinePoint[];
      bollingerMiddleRef.current.setData(middleData);
    }
    if (bollingerLowerRef.current && bollinger) {
      const lowerData: LinePoint[] = bollinger.lower
        .map((v, i) => (v !== null ? { time: data[i].time as Time, value: v } : null))
        .filter(Boolean) as LinePoint[];
      bollingerLowerRef.current.setData(lowerData);
    }
    if (rsiSeriesRef.current && rsi) {
      const rsiData: LinePoint[] = rsi
        .map((v, i) => (v !== null ? { time: data[i].time as Time, value: v } : null))
        .filter(Boolean) as LinePoint[];
      rsiSeriesRef.current.setData(rsiData);
    }
    if (macdHistogramRef.current && macd) {
      const macdHistogramData: VolumePoint[] = macd.histogram
        .map((v, i) => ({
          time: data[i].time as Time,
          value: v !== null ? Math.abs(v) : 0,
          color: v !== null
            ? v >= 0
              ? "rgba(16,185,129,0.6)"
              : "rgba(248,81,73,0.6)"
            : "rgba(255,255,255,0)",
        }));
      macdHistogramRef.current.setData(macdHistogramData);
    }
    if (macdSignalRef.current && macd) {
      const macdSignalData: LinePoint[] = macd.signalLine
        .map((v, i) => (v !== null ? { time: data[i].time as Time, value: v } : null))
        .filter(Boolean) as LinePoint[];
      macdSignalRef.current.setData(macdSignalData);
    }
  }, [data, type, chartData, volumeData, sma20, sma50, bollinger, rsi, macd]);

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
      style={{ width: "100%", height, position: "relative" }}
    />
  );
}
