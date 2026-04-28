"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api";
import { useOHLCV } from "@/hooks/useOHLCV";
import { useTechnical } from "@/hooks/useTechnical";
import { useSettings } from "@/hooks/useSettings";
import { SymbolSearch } from "@/components/SymbolSearch";
import { MarketChart } from "@/components/MarketChart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { Section } from "@/components/ui/Section";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { OHLCVPoint, OHLCVResponse } from "@/types";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  CandlestickChart,
  LineChart,
  Activity,
} from "lucide-react";

const PERIODS = [
  { value: "1d", label: "1D" },
  { value: "5d", label: "5D" },
  { value: "1mo", label: "1M" },
  { value: "3mo", label: "3M" },
  { value: "6mo", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "5y", label: "5Y" },
] as const;

type ChartType = "candle" | "line" | "area";

function SummaryCard({
  data,
  formatCurrency,
}: {
  data: { time: number; close: number; high: number; low: number; open: number }[];
  formatCurrency: (value: number) => string;
}) {
  if (data.length < 2) return null;

  const latest = data[data.length - 1];
  const first = data[0];
  const periodChange = latest.close - first.close;
  const periodChangePct = first.close !== 0 ? (periodChange / first.close) * 100 : 0;
  const periodHigh = Math.max(...data.map((d) => d.high));
  const periodLow = Math.min(...data.map((d) => d.low));

  return (
    <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: "20px" }}>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-text-tertiary">Prix actuel</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {formatCurrency(latest.close)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-text-tertiary">Variation période</p>
          <div className="flex items-center gap-2 mt-1">
            <p
              className={cn(
                "text-2xl font-bold",
                periodChange >= 0 ? "text-gain" : "text-loss"
              )}
            >
              {periodChange >= 0 ? "+" : ""}
              {formatCurrency(periodChange)}
            </p>
          </div>
          <div className="flex items-center gap-1 mt-1">
            {periodChange >= 0 ? (
              <TrendingUp className="w-4 h-4 text-gain" />
            ) : (
              <TrendingDown className="w-4 h-4 text-loss" />
            )}
            <span
              className={cn(
                "text-sm font-medium",
                periodChange >= 0 ? "text-gain" : "text-loss"
              )}
            >
              {periodChangePct >= 0 ? "+" : ""}
              {periodChangePct.toFixed(2)}%
            </span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-text-tertiary">Plus haut (période)</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {formatCurrency(periodHigh)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-text-tertiary">Plus bas (période)</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {formatCurrency(periodLow)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MarketsPage() {
  const [symbol, setSymbol] = useState("");
  const [period, setPeriod] = useState<string>("6mo");
  const [chartType, setChartType] = useState<ChartType>("candle");
  const [showSMA20, setShowSMA20] = useState(false);
  const [showSMA50, setShowSMA50] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);

  const { formatCurrency } = useSettings();

  const interval = period === "1d" ? "5m" : "1d";

        const {
                data: ohlcv,
                isLoading,
                error,
        } = useOHLCV(symbol, period, interval);

        const { data: technical } = useTechnical(symbol);

        // Lazy-load chunks when user zooms back beyond loaded data
        const [lazyChunks, setLazyChunks] = useState<OHLCVPoint[]>([]);
        const symbolRef = useRef(symbol);

        useEffect(() => {
                setLazyChunks([]);
                symbolRef.current = symbol;
        }, [symbol]);

        const handleLoadMore = useCallback(async (earliestTime: number) => {
                const endDate = new Date((earliestTime - 86400) * 1000).toISOString().split("T")[0];
                const startDate = new Date((earliestTime - 365 * 86400) * 1000).toISOString().split("T")[0];
                try {
                        const resp = await fetchApi<OHLCVResponse>(
                                `/api/v1/technical/ohlcv?symbol=${encodeURIComponent(symbolRef.current)}&start_date=${startDate}&end_date=${endDate}&interval=1d`
                        );
                        if (resp.data?.length > 0) {
                                setLazyChunks(prev => [...resp.data, ...prev]);
                        }
                } catch {
                        // Silently ignore — user can try zooming again
                }
        }, []);

        // Merge initial + lazy chunks, dedup by time
        const mergedData = useMemo(() => {
                const inline = ohlcv?.data || [];
                const all = [...lazyChunks, ...inline];
                const seen = new Set<number>();
                return all
                        .filter(p => { if (seen.has(p.time)) return false; seen.add(p.time); return true; })
                        .sort((a, b) => a.time - b.time);
        }, [ohlcv?.data, lazyChunks]);

        const summaryData = useMemo(() => {
                if (mergedData.length === 0) return [];
                return mergedData.map((d) => ({
                        time: d.time,
                        close: d.close,
                        high: d.high,
                        low: d.low,
                        open: d.open,
                }));
        }, [mergedData]);

        const hasData = mergedData.length > 0;

  return (
    <PageTransition>
      <Section variant="hero">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 500, color: "var(--text-primary)", margin: 0 }}>
            Marchés
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              textTransform: "uppercase",
              fontSize: 12,
              letterSpacing: "1px",
              color: "var(--text-tertiary)",
              marginTop: 8,
              marginBottom: 0,
            }}
          >
            Analyse technique · Graphiques
          </p>
        </div>
      </Section>

      <Section variant="editorial">
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Search */}
          <style>{`
            .ferrari-symbol-search input {
              background: transparent !important;
              border-color: var(--border-input) !important;
            }
            .ferrari-symbol-search input:focus {
              border-color: #14b8a6 !important;
              box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.25) !important;
            }
          `}</style>
          <div className="ferrari-symbol-search" style={{ maxWidth: 420 }}>
            <SymbolSearch value={symbol} onChange={setSymbol} />
          </div>

          {/* Loading */}
          {isLoading && (
            <>
              <Skeleton style={{ height: 500 }} />
              <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: "20px" }}>
                <Skeleton style={{ height: 96 }} />
                <Skeleton style={{ height: 96 }} />
                <Skeleton style={{ height: 96 }} />
                <Skeleton style={{ height: 96 }} />
              </div>
            </>
          )}

          {/* Error */}
          {error && !isLoading && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-text-tertiary">
                  Erreur lors du chargement des données pour {symbol}.
                </p>
                {(error as Error)?.message && (
                  <p className="text-xs text-text-muted mt-1">
                    {(error as Error).message}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* No symbol selected */}
          {!symbol && !isLoading && (
            <div
              className="flex flex-col items-center justify-center gap-4 py-16"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
              }}
            >
              <BarChart3 className="w-12 h-12 text-text-muted opacity-50" />
              <p className="text-text-tertiary text-lg">
                Recherchez un symbole pour afficher le graphique
              </p>
              <p className="text-text-muted text-sm">
                Exemple: AAPL, BTC-USD, AIR.PA, BRK.B
              </p>
            </div>
          )}

          {/* Chart and details */}
          {hasData && !isLoading && (
            <>
              {/* Controls */}
              <div
                className="flex flex-wrap items-center gap-4 p-4"
                style={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-lg)",
                }}
              >
                {/* Timeframe */}
                <div className="flex gap-1">
                  {PERIODS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPeriod(p.value)}
                      className={cn(
                        "px-3 py-1 text-sm rounded-lg transition-colors font-medium",
                        period === p.value
                          ? "bg-primary text-white"
                          : "bg-surface-raised text-text-secondary hover:bg-surface"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className="w-px h-6" style={{ background: "var(--border)" }} />

                {/* Chart type toggle */}
                <div className="flex rounded-[var(--r-md)] overflow-hidden border border-border">
                  <button
                    onClick={() => setChartType("candle")}
                    className={cn(
                      "px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium transition-colors",
                      chartType === "candle"
                        ? "bg-primary text-white"
                        : "bg-surface-raised text-text-secondary hover:bg-surface"
                    )}
                  >
                    <CandlestickChart className="w-4 h-4" />
                    <span className="hidden sm:inline">Candle</span>
                  </button>
                  <button
                    onClick={() => setChartType("line")}
                    className={cn(
                      "px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium transition-colors",
                      chartType === "line"
                        ? "bg-primary text-white"
                        : "bg-surface-raised text-text-secondary hover:bg-surface"
                    )}
                  >
                    <LineChart className="w-4 h-4" />
                    <span className="hidden sm:inline">Ligne</span>
                  </button>
                  <button
                    onClick={() => setChartType("area")}
                    className={cn(
                      "px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium transition-colors",
                      chartType === "area"
                        ? "bg-primary text-white"
                        : "bg-surface-raised text-text-secondary hover:bg-surface"
                    )}
                  >
                    <Activity className="w-4 h-4" />
                    <span className="hidden sm:inline">Aire</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="w-px h-6" style={{ background: "var(--border)" }} />

                {/* Overlay toggles */}
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showSMA20}
                      onChange={(e) => setShowSMA20(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-text-secondary font-medium">SMA 20</span>
                    <Badge
                      variant="warning"
                      style={{ fontSize: "8px", padding: "2px 5px" }}
                    >
                      SMA
                    </Badge>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showSMA50}
                      onChange={(e) => setShowSMA50(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-text-secondary font-medium">SMA 50</span>
                    <Badge
                      variant="info"
                      style={{ fontSize: "8px", padding: "2px 5px" }}
                    >
                      SMA
                    </Badge>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showBollinger}
                      onChange={(e) => setShowBollinger(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-text-secondary font-medium">Bollinger</span>
                    <Badge
                      variant="neutral"
                      style={{ fontSize: "8px", padding: "2px 5px" }}
                    >
                      BB
                    </Badge>
                  </label>
                </div>
              </div>

              {/* Summary Cards */}
              <SummaryCard data={summaryData} formatCurrency={formatCurrency} />

              {/* Technical Indicators */}
              {technical && (
                <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: "20px" }}>
                  {technical.rsi !== null && (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-text-tertiary">RSI (14)</p>
                        <p
                          className={cn(
                            "text-2xl font-bold mt-1",
                            (technical.rsi ?? 0) > 70
                              ? "text-loss"
                              : (technical.rsi ?? 0) < 30
                              ? "text-gain"
                              : "text-text-primary"
                          )}
                        >
                          {(technical.rsi ?? 0).toFixed(1)}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          {(technical.rsi ?? 0) > 70
                            ? "Suracheté"
                            : (technical.rsi ?? 0) < 30
                            ? "Survendu"
                            : "Neutre"}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  {technical.sma_20 !== null && (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-text-tertiary">SMA 20</p>
                        <p className="text-2xl font-bold text-text-primary mt-1">
                          {formatCurrency(technical.sma_20 ?? 0)}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  {technical.sma_50 !== null && (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-text-tertiary">SMA 50</p>
                        <p className="text-2xl font-bold text-text-primary mt-1">
                          {formatCurrency(technical.sma_50 ?? 0)}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  {technical.macd && technical.macd.histogram !== null && (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-text-tertiary">MACD</p>
                        <p
                          className={cn(
                            "text-lg font-bold mt-1",
                            (technical.macd.histogram ?? 0) >= 0
                              ? "text-gain"
                              : "text-loss"
                          )}
                        >
                          {(technical.macd.histogram ?? 0).toFixed(4)}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          Signal: {(technical.macd.signal_line ?? 0).toFixed(4)}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Show technical indicators missing state */}
              {!technical && symbol && (
                <Card>
                  <CardContent className="py-6 text-center">
                    <p className="text-sm text-text-tertiary">
                      Indicateurs techniques non disponibles pour {symbol}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </Section>

      {/* Cinematic: Full-width MarketChart */}
      {hasData && !isLoading && (
        <Section variant="cinematic">
          <ErrorBoundary>
            <MarketChart
              data={mergedData}
              type={chartType}
              showVolume={chartType === "candle"}
              showSMA20={showSMA20}
              showSMA50={showSMA50}
              showBollinger={showBollinger}
              onLoadMore={handleLoadMore}
            />
          </ErrorBoundary>
        </Section>
      )}
    </PageTransition>
  );
}
