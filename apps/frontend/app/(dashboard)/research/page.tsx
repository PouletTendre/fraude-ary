"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSettings } from "@/hooks/useSettings";
import { useOHLCV } from "@/hooks/useOHLCV";
import { fetchApi } from "@/lib/api";
import { PageSection } from "@/components/ui/PageSection";
import { PageTransition } from "@/components/ui/PageTransition";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SymbolSearch } from "@/components/SymbolSearch";
import { MarketChart } from "@/components/MarketChart";
import { CompanyProfile } from "@/components/CompanyProfile";
import { AnalystTargets } from "@/components/AnalystTargets";
import { FinancialStatements } from "@/components/FinancialStatements";
import { PeerComparison } from "@/components/PeerComparison";
import { Card } from "@/components/ui/Card";
import { CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Search } from "lucide-react";

function formatLargeNumber(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "\u20ac",
  GBP: "\u00a3",
  JPY: "\u00a5",
  CHF: "CHF",
};

interface MetricDef {
  key: string;
  label: string;
  format: (
    v: number,
    currencySymbol: string,
    formatCurrency: (v: number, c?: string) => string,
    profile?: Record<string, unknown>,
  ) => string;
}

const METRICS: MetricDef[] = [
  {
    key: "market_cap",
    label: "Market Cap",
    format: (v, sym) => sym + formatLargeNumber(v),
  },
  {
    key: "enterprise_value",
    label: "Enterprise Value",
    format: (v, sym) => sym + formatLargeNumber(v),
  },
  {
    key: "pe_ratio",
    label: "P/E Ratio",
    format: (v) => `${v.toFixed(1)}x`,
  },
  {
    key: "forward_pe",
    label: "Forward P/E",
    format: (v) => `${v.toFixed(1)}x`,
  },
  {
    key: "peg_ratio",
    label: "PEG Ratio",
    format: (v) => `${v.toFixed(1)}x`,
  },
  {
    key: "pb_ratio",
    label: "P/B Ratio",
    format: (v) => `${v.toFixed(1)}x`,
  },
  {
    key: "beta",
    label: "Beta",
    format: (v) => v.toFixed(2),
  },
  {
    key: "fifty_two_week_low",
    label: "52-Week Range",
    format: (_v, _sym, _fmt, profile?: Record<string, unknown>) => {
      const low = profile?.fifty_two_week_low as number | undefined;
      const high = profile?.fifty_two_week_high as number | undefined;
      if (low === undefined && high === undefined) return "\u2014";
      const parts: string[] = [];
      if (low !== undefined) parts.push(_fmt(low));
      parts.push("\u2013");
      if (high !== undefined) parts.push(_fmt(high));
      return parts.join(" ");
    },
  },
  {
    key: "dividend_yield",
    label: "Dividend Yield",
    format: (v) => `${(v * 100).toFixed(2)}%`,
  },
  {
    key: "profit_margins",
    label: "Profit Margin",
    format: (v) => `${(v * 100).toFixed(1)}%`,
  },
  {
    key: "return_on_equity",
    label: "ROE",
    format: (v) => `${(v * 100).toFixed(1)}%`,
  },
  {
    key: "return_on_assets",
    label: "ROA",
    format: (v) => `${(v * 100).toFixed(1)}%`,
  },
  {
    key: "revenue_growth",
    label: "Revenue Growth",
    format: (v) => `${(v * 100).toFixed(1)}%`,
  },
  {
    key: "earnings_growth",
    label: "Earnings Growth",
    format: (v) => `${(v * 100).toFixed(1)}%`,
  },
];

function KeyMetricsCard({
  profile,
  isLoading,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile?: any;
  isLoading?: boolean;
}) {
  const { settings, formatCurrency } = useSettings();
  const currencySymbol = CURRENCY_SYMBOLS[settings.currency] || settings.currency;

  if (isLoading) {
    return (
      <Card style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Skeleton style={{ height: "18px", width: "35%", borderRadius: "var(--r-md)" }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <Skeleton style={{ height: "10px", width: "50%", borderRadius: "var(--r-md)" }} />
              <Skeleton style={{ height: "16px", width: "70%", borderRadius: "var(--r-md)" }} />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!profile) return null;

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <span
        style={{
          fontSize: "14px",
          fontWeight: 590,
          color: "var(--text-primary)",
        }}
      >
        Key Metrics
      </span>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        {METRICS.map((metric) => {
          const val =
            metric.key === "fifty_two_week_low"
              ? null
              : (profile[metric.key] as number | undefined);
          const display =
            metric.key === "fifty_two_week_low"
              ? metric.format(0, currencySymbol, formatCurrency, profile)
              : val !== undefined && val !== null
                ? metric.format(val, currencySymbol, formatCurrency)
                : "\u2014";

          return (
            <div
              key={metric.key}
              style={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 510,
                  color: "var(--text-tertiary)",
                }}
              >
                {metric.label}
              </span>
              <span
                className="font-tnum"
                style={{
                  fontSize: "14px",
                  fontWeight: 510,
                  color: "var(--text-primary)",
                }}
              >
                {display}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function ResearchPage() {
  const { formatCurrency } = useSettings();
  const [symbol, setSymbol] = useState("");
  const [period, setPeriod] = useState("3mo");
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(false);

  const { data: ohlcv, isLoading: ohlcvLoading } = useOHLCV(
    symbol,
    period,
    period === "1d" ? "5m" : "1d",
  );
  const ohlcvData = ohlcv?.data || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["research", "profile", symbol],
    queryFn: () =>
      fetchApi(`/api/v1/research/profile/${encodeURIComponent(symbol)}`),
    enabled: !!symbol,
    staleTime: 3600000,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: analysts, isLoading: analystsLoading } = useQuery<any>({
    queryKey: ["research", "analysts", symbol],
    queryFn: () =>
      fetchApi(`/api/v1/research/analysts/${encodeURIComponent(symbol)}`),
    enabled: !!symbol,
    staleTime: 3600000,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: financials, isLoading: financialsLoading } = useQuery<any>({
    queryKey: ["research", "financials", symbol],
    queryFn: () =>
      fetchApi(`/api/v1/research/financials/${encodeURIComponent(symbol)}`),
    enabled: !!symbol,
    staleTime: 21600000,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: peers, isLoading: peersLoading } = useQuery<any>({
    queryKey: ["research", "peers", symbol],
    queryFn: () =>
      fetchApi(`/api/v1/research/peers/${encodeURIComponent(symbol)}`),
    enabled: !!symbol,
    staleTime: 3600000,
  });

  return (
    <PageTransition>
      <PageSection>
        <div style={{ marginBottom: "32px" }}>
          <h1 className="text-h1" style={{ margin: 0 }}>
            Equity Research
          </h1>
          <p
            className="text-caption-lg text-text-tertiary"
            style={{ marginTop: "6px" }}
          >
            Analyse fondamentale · technique · financière
          </p>
        </div>

        <div style={{ marginBottom: "32px" }}>
          <SymbolSearch value={symbol} onChange={setSymbol} />
        </div>

        {!symbol ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Search className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-h3" style={{ marginBottom: "8px" }}>
                Recherchez un symbole
              </p>
              <p className="text-small text-text-tertiary">
                Entrez un ticker (AAPL, TSLA, SPY...) pour commencer
                l&apos;analyse
              </p>
            </CardContent>
          </Card>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <div
              className="grid grid-cols-1 lg:grid-cols-2"
              style={{ gap: "24px" }}
            >
              <ErrorBoundary>
                <CompanyProfile data={profile} isLoading={profileLoading} />
              </ErrorBoundary>
              <ErrorBoundary>
                <Card>
                  <div style={{ padding: "16px 16px 8px" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        marginBottom: "12px",
                      }}
                    >
                      {["1d", "5d", "1mo", "3mo", "6mo", "1y", "5y"].map(
                        (p) => (
                          <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            style={{
                              padding: "4px 10px",
                              fontSize: "12px",
                              fontWeight: 510,
                              borderRadius: "6px",
                              border: `1px solid ${period === p ? "var(--primary)" : "var(--border-solid)"}`,
                              background:
                                period === p
                                  ? "var(--primary-muted)"
                                  : "transparent",
                              color:
                                period === p
                                  ? "var(--primary-hover)"
                                  : "var(--text-secondary)",
                              cursor: "pointer",
                              transition: "all 150ms",
                            }}
                          >
                            {p.toUpperCase()}
                          </button>
                        ),
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      {(
                        [
                          {
                            key: "rsi",
                            label: "RSI",
                            state: showRSI,
                            set: setShowRSI,
                          },
                          {
                            key: "macd",
                            label: "MACD",
                            state: showMACD,
                            set: setShowMACD,
                          },
                        ] as const
                      ).map((t) => (
                        <label
                          key={t.key}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={t.state}
                            onChange={(e) => t.set(e.target.checked)}
                            style={{ accentColor: "var(--primary)" }}
                          />
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 510,
                              color: "var(--text-secondary)",
                            }}
                          >
                            {t.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: "0 16px 16px" }}>
                    {ohlcvLoading ? (
                      <Skeleton style={{ height: 450 }} />
                    ) : (
                      <MarketChart
                        data={ohlcvData}
                        type="candle"
                        showVolume={true}
                        showRSI={showRSI}
                        showMACD={showMACD}
                        height={450}
                      />
                    )}
                  </div>
                </Card>
              </ErrorBoundary>
            </div>

            <div
              className="grid grid-cols-1 lg:grid-cols-3"
              style={{ gap: "24px" }}
            >
              <ErrorBoundary>
                <KeyMetricsCard profile={profile} isLoading={profileLoading} />
              </ErrorBoundary>
              <ErrorBoundary>
                <AnalystTargets
                  data={analysts}
                  currentPrice={ohlcvData?.[ohlcvData.length - 1]?.close}
                  formatCurrency={formatCurrency}
                  isLoading={analystsLoading}
                />
              </ErrorBoundary>
              <ErrorBoundary>
                <FinancialStatements
                  data={financials}
                  isLoading={financialsLoading}
                />
              </ErrorBoundary>
            </div>

            <ErrorBoundary>
              <PeerComparison data={peers} isLoading={peersLoading} />
            </ErrorBoundary>
          </div>
        )}
      </PageSection>
    </PageTransition>
  );
}
