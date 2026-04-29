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
import { PageSection } from "@/components/ui/PageSection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { OHLCVPoint, OHLCVResponse } from "@/types";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  CandlestickChart,
  LineChart,
  Activity,
  Search,
} from "lucide-react";
import { NewsCard } from "@/components/ui/NewsCard";
import { ValuationCard } from "@/components/ui/ValuationCard";

function rsiBadge(rsi: number | null): { label: string; variant: "success" | "neutral" | "subtle" } {
  if (rsi === null) return { label: "--", variant: "neutral" };
  if (rsi > 70) return { label: "Suracheté", variant: "subtle" };
  if (rsi < 30) return { label: "Survendu", variant: "success" };
  return { label: "Neutre", variant: "neutral" };
}

function RsiGauge({ value }: { value: number | null }) {
  const pct = value !== null ? Math.max(0, Math.min(100, value)) : 0;
  const color =
    value === null ? "var(--text-muted)" :
    value > 70 ? "var(--loss)" :
    value < 30 ? "var(--gain)" :
    "var(--warning)";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-small text-text-secondary">RSI (14)</span>
        <span className="text-h3 font-tnum" style={{ color }}>
          {value !== null ? value.toFixed(1) : "--"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-sunken overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-text-muted">
        <span>0</span>
        <span className={value !== null && value < 30 ? "text-gain w-590" : ""}>30</span>
        <span className={value !== null && value >= 30 && value <= 70 ? "text-warning w-590" : ""}>50</span>
        <span className={value !== null && value > 70 ? "text-loss w-590" : ""}>70</span>
        <span>100</span>
      </div>
    </div>
  );
}

function IndicatorCard({
  title,
  children,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  badge?: { label: string; variant: "success" | "neutral" | "subtle" };
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function fmtVal(val: number | null, decimals: number = 2): string {
  if (val === null || val === undefined) return "--";
  return val.toFixed(decimals);
}

function macdBadge(histogram: number | null): { label: string; variant: "success" | "neutral" | "subtle" } {
  if (histogram === null) return { label: "--", variant: "neutral" };
  if (histogram > 0) return { label: "Haussier", variant: "success" };
  if (histogram < 0) return { label: "Baissier", variant: "subtle" };
  return { label: "Neutre", variant: "neutral" };
}

function formatObv(value: number): string {
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(0);
}

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
          <p className="text-caption-lg text-text-tertiary">Prix actuel</p>
          <p className="text-2xl font-tnum text-text-primary mt-1 w-590">
            {formatCurrency(latest.close)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-caption-lg text-text-tertiary">Variation période</p>
          <div className="flex items-center gap-2 mt-1">
            <p
              className={cn(
                "text-2xl font-tnum w-590",
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
                "text-caption-lg",
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
          <p className="text-caption-lg text-text-tertiary">Plus haut (période)</p>
          <p className="text-2xl font-tnum text-text-primary mt-1 w-590">
            {formatCurrency(periodHigh)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-caption-lg text-text-tertiary">Plus bas (période)</p>
          <p className="text-2xl font-tnum text-text-primary mt-1 w-590">
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
      <PageSection>
        <div style={{ marginBottom: "32px" }}>
          <h1 className="text-h1" style={{ margin: 0 }}>
            Marchés
          </h1>
          <p className="text-small text-text-secondary" style={{ marginTop: "6px" }}>
            Graphiques · Indicateurs techniques · Actualités
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Search */}
          <div style={{ maxWidth: 420 }}>
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
                  <p className="text-caption text-text-muted mt-1">
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
                        "px-3 py-1 text-caption-lg transition-colors w-510",
                        period === p.value
                          ? "bg-surface-raised text-text-primary"
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
                      "px-3 py-1.5 flex items-center gap-1.5 text-caption-lg transition-colors w-510",
                      chartType === "candle"
                        ? "bg-surface-raised text-text-primary"
                        : "bg-surface-raised text-text-secondary hover:bg-surface"
                    )}
                  >
                    <CandlestickChart className="w-4 h-4" />
                    <span className="hidden sm:inline">Candle</span>
                  </button>
                  <button
                    onClick={() => setChartType("line")}
                    className={cn(
                      "px-3 py-1.5 flex items-center gap-1.5 text-caption-lg transition-colors w-510",
                      chartType === "line"
                        ? "bg-surface-raised text-text-primary"
                        : "bg-surface-raised text-text-secondary hover:bg-surface"
                    )}
                  >
                    <LineChart className="w-4 h-4" />
                    <span className="hidden sm:inline">Ligne</span>
                  </button>
                  <button
                    onClick={() => setChartType("area")}
                    className={cn(
                      "px-3 py-1.5 flex items-center gap-1.5 text-caption-lg transition-colors w-510",
                      chartType === "area"
                        ? "bg-surface-raised text-text-primary"
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
                    <span className="text-caption-lg text-text-secondary w-510">SMA 20</span>
                    <Badge
                      variant="neutral"
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
                    <span className="text-caption-lg text-text-secondary w-510">SMA 50</span>
                    <Badge
                      variant="neutral"
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
                    <span className="text-caption-lg text-text-secondary w-510">Bollinger</span>
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

              {/* Technical Indicators — full analysis dashboard */}
              {technical && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: "20px" }}>
                    {/* RSI */}
                    <IndicatorCard
                      title="RSI"
                      badge={rsiBadge(technical.rsi)}
                    >
                      <RsiGauge value={technical.rsi} />
                    </IndicatorCard>

                    {/* MACD */}
                    <IndicatorCard
                      title="MACD"
                      badge={macdBadge(technical.macd?.histogram ?? null)}
                    >
                      {technical.macd ? (
                        <div className="space-y-2 font-tnum">
                          <div className="flex justify-between">
                            <span className="text-small text-text-muted">MACD Line</span>
                            <span className="text-small text-text-primary">{fmtVal(technical.macd.macd_line, 4)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-small text-text-muted">Signal</span>
                            <span className="text-small text-text-primary">{fmtVal(technical.macd.signal_line, 4)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-small text-text-muted">Histogramme</span>
                            <span className={cn("text-small-medium", (technical.macd.histogram ?? 0) >= 0 ? "text-gain" : "text-loss")}>
                              {fmtVal(technical.macd.histogram, 4)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-small text-text-tertiary">Pas de données</p>
                      )}
                    </IndicatorCard>

                    {/* Bollinger Bands */}
                    <IndicatorCard title="Bollinger">
                      {technical.bollinger ? (
                        <div className="space-y-2 font-tnum">
                          <div className="flex justify-between">
                            <span className="text-small text-text-muted">Upper</span>
                            <span className="text-small text-text-primary">{fmtVal(technical.bollinger.upper)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-small text-text-muted">Middle</span>
                            <span className="text-small text-text-primary">{fmtVal(technical.bollinger.middle)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-small text-text-muted">Lower</span>
                            <span className="text-small text-text-primary">{fmtVal(technical.bollinger.lower)}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-small text-text-tertiary">Pas de données</p>
                      )}
                    </IndicatorCard>

                    {/* Moving Averages */}
                    <IndicatorCard title="Moyennes Mobiles">
                      <div className="space-y-2 font-tnum">
                        <div className="flex justify-between">
                          <span className="text-small text-text-muted">SMA 20</span>
                          <span className="text-small text-text-primary">{fmtVal(technical.sma_20)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-small text-text-muted">SMA 50</span>
                          <span className="text-small text-text-primary">{fmtVal(technical.sma_50)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-small text-text-muted">SMA 200</span>
                          <span className="text-small text-text-primary">{fmtVal(technical.sma_200)}</span>
                        </div>
                        <div className="border-t border-border pt-2 mt-2">
                          <div className="flex justify-between">
                            <span className="text-small text-text-muted">EMA 12</span>
                            <span className="text-small text-text-primary">{fmtVal(technical.ema_12)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-small text-text-muted">EMA 26</span>
                            <span className="text-small text-text-primary">{fmtVal(technical.ema_26)}</span>
                          </div>
                        </div>
                      </div>
                    </IndicatorCard>

                    {/* ATR */}
                    <IndicatorCard title="ATR">
                      <div className="flex items-center justify-center py-4">
                        <span className="text-h3 font-tnum text-text-primary">
                          {fmtVal(technical.atr)}
                        </span>
                      </div>
                    </IndicatorCard>

                    {/* OBV */}
                    <IndicatorCard title="OBV">
                      <div className="flex items-center justify-center py-4">
                        <span className="text-h3 font-tnum text-text-primary">
                          {technical.obv !== null ? formatObv(technical.obv) : "--"}
                        </span>
                      </div>
                    </IndicatorCard>

                    {/* Stochastic */}
                    <IndicatorCard title="Stochastique">
                      {technical.stochastic ? (
                        <div className="space-y-2 font-tnum">
                          <div className="flex justify-between">
                            <span className="text-small text-text-muted">%K</span>
                            <span className="text-small text-text-primary">{fmtVal(technical.stochastic.stoch_k)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-small text-text-muted">%D</span>
                            <span className="text-small text-text-primary">{fmtVal(technical.stochastic.stoch_d)}</span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Badge
                              variant={technical.stochastic.stoch_k > 80 ? "subtle" : technical.stochastic.stoch_k < 20 ? "success" : "neutral"}
                            >
                              %K: {technical.stochastic.stoch_k > 80 ? "Suracheté" : technical.stochastic.stoch_k < 20 ? "Survendu" : "Neutre"}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <p className="text-small text-text-tertiary">Pas de données</p>
                      )}
                    </IndicatorCard>

                    {/* MFI */}
                    <IndicatorCard
                      title="MFI"
                      badge={{
                        label: technical.mfi !== null ? (technical.mfi > 80 ? "Suracheté" : technical.mfi < 20 ? "Survendu" : "Neutre") : "--",
                        variant: technical.mfi !== null ? (technical.mfi > 80 ? "subtle" : technical.mfi < 20 ? "success" : "neutral") : "neutral",
                      }}
                    >
                      <div className="flex items-center justify-center py-4">
                        <span className="text-h3 font-tnum text-text-primary">
                          {fmtVal(technical.mfi)}
                        </span>
                      </div>
                    </IndicatorCard>

                    {/* Symbol Info */}
                    <IndicatorCard title="Symbole">
                      <div className="py-4 text-center">
                        <span className="text-h3 text-text-primary w-590">
                          {technical.symbol}
                        </span>
                      </div>
                    </IndicatorCard>
                  </div>

                  {/* Valuation */}
                  <ValuationCard symbol={symbol} />

                  {/* News */}
                  <NewsCard symbol={symbol} />
                </>
              )}

              {/* Show technical indicators missing state */}
              {!technical && symbol && (
                <Card>
                  <CardContent className="py-6 text-center">
                    <p className="text-small text-text-tertiary">
                      Indicateurs techniques non disponibles pour {symbol}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Full-width MarketChart */}
        {hasData && !isLoading && (
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
        )}
      </PageSection>
    </PageTransition>
  );
}
