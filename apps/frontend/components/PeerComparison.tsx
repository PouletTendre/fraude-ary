"use client";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSettings } from "@/hooks/useSettings";

interface PeerComparisonProps {
  data?: {
    symbol: string;
    peers: Array<{
      symbol: string;
      name?: string;
      market_cap?: number;
      pe_ratio?: number;
      forward_pe?: number;
      peg_ratio?: number;
      pb_ratio?: number;
      ev_revenue?: number;
      ev_ebitda?: number;
      beta?: number;
      dividend_yield?: number;
      operating_margins?: number;
      profit_margins?: number;
      revenue_growth?: number;
      earnings_growth?: number;
      return_on_equity?: number;
    }>;
  };
  isLoading?: boolean;
}

interface ColumnDef {
  key: string;
  label: string;
  format: (v: number, currencySymbol: string) => string;
  lowerBetter: boolean;
}

function fmtLarge(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

const COLUMNS: ColumnDef[] = [
  {
    key: "market_cap",
    label: "Market Cap",
    format: (v, s) => `${s}${fmtLarge(v)}`,
    lowerBetter: false,
  },
  {
    key: "pe_ratio",
    label: "P/E",
    format: (v) => `${v.toFixed(1)}x`,
    lowerBetter: true,
  },
  {
    key: "forward_pe",
    label: "Forward P/E",
    format: (v) => `${v.toFixed(1)}x`,
    lowerBetter: true,
  },
  {
    key: "peg_ratio",
    label: "PEG",
    format: (v) => `${v.toFixed(1)}x`,
    lowerBetter: true,
  },
  {
    key: "pb_ratio",
    label: "P/B",
    format: (v) => `${v.toFixed(1)}x`,
    lowerBetter: true,
  },
  {
    key: "ev_revenue",
    label: "EV/Revenue",
    format: (v) => `${v.toFixed(1)}x`,
    lowerBetter: true,
  },
  {
    key: "ev_ebitda",
    label: "EV/EBITDA",
    format: (v) => `${v.toFixed(1)}x`,
    lowerBetter: true,
  },
  {
    key: "beta",
    label: "Beta",
    format: (v) => v.toFixed(2),
    lowerBetter: true,
  },
  {
    key: "dividend_yield",
    label: "Div Yield",
    format: (v) => `${(v * 100).toFixed(2)}%`,
    lowerBetter: false,
  },
  {
    key: "operating_margins",
    label: "Op Margin",
    format: (v) => `${(v * 100).toFixed(1)}%`,
    lowerBetter: false,
  },
  {
    key: "profit_margins",
    label: "Profit Margin",
    format: (v) => `${(v * 100).toFixed(1)}%`,
    lowerBetter: false,
  },
  {
    key: "revenue_growth",
    label: "Rev Growth",
    format: (v) => `${(v * 100).toFixed(1)}%`,
    lowerBetter: false,
  },
  {
    key: "earnings_growth",
    label: "EPS Growth",
    format: (v) => `${(v * 100).toFixed(1)}%`,
    lowerBetter: false,
  },
  {
    key: "return_on_equity",
    label: "ROE",
    format: (v) => `${(v * 100).toFixed(1)}%`,
    lowerBetter: false,
  },
];

export function PeerComparison({ data, isLoading }: PeerComparisonProps) {
  const { settings } = useSettings();

  const currencySymbols: Record<string, string> = {
    USD: "$",
    EUR: "\u20ac",
    GBP: "\u00a3",
    JPY: "\u00a5",
    CHF: "CHF",
  };
  const currencySymbol = currencySymbols[settings.currency] || settings.currency;

  if (isLoading) {
    return (
      <Card style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Skeleton style={{ height: "20px", width: "40%", borderRadius: "var(--r-md)" }} />
        <div style={{ overflowX: "hidden" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ minWidth: "120px" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} style={{ height: "16px", width: "80%", marginBottom: "12px", borderRadius: "var(--r-md)" }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: "24px", overflow: "hidden" }}>
              {Array.from({ length: 7 }).map((_, ci) => (
                <div key={ci} style={{ minWidth: "80px" }}>
                  {Array.from({ length: 5 }).map((_, ri) => (
                    <Skeleton
                      key={ri}
                      style={{ height: "16px", width: `${60 + Math.random() * 30}%`, marginBottom: "12px", borderRadius: "var(--r-md)" }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!data || !data.peers.length) return null;

  const { symbol: searchSymbol, peers } = data;

  const bestValues: Record<string, number | null> = {};

  for (const col of COLUMNS) {
    const values = peers
      .map((p) => (p as Record<string, unknown>)[col.key] as number | undefined)
      .filter((v): v is number => v !== undefined && v !== null);
    if (!values.length) {
      bestValues[col.key] = null;
      continue;
    }
    bestValues[col.key] = col.lowerBetter ? Math.min(...values) : Math.max(...values);
  }

  const cellStyle: React.CSSProperties = {
    padding: "6px 10px",
    fontSize: "13px",
    fontWeight: 400,
    color: "var(--text-primary)",
    whiteSpace: "nowrap",
    borderBottom: "1px solid var(--border-subtle)",
  };

  const stickyCellStyle: React.CSSProperties = {
    ...cellStyle,
    position: "sticky",
    left: 0,
    zIndex: 1,
    background: "rgba(255,255,255,0.02)",
  };

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px" }}>
      <span
        style={{
          fontSize: "14px",
          fontWeight: 590,
          color: "var(--text-primary)",
        }}
      >
        Peer Comparison
      </span>

      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: "max-content" }}>
          {/* Header row */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border)",
              paddingBottom: "6px",
              marginBottom: "2px",
            }}
          >
            <div
              style={{
                ...stickyCellStyle,
                fontSize: "12px",
                fontWeight: 590,
                color: "var(--text-secondary)",
                minWidth: "140px",
                borderBottom: "none",
                padding: "4px 10px",
              }}
            >
              Symbol
            </div>
            {COLUMNS.map((col) => (
              <div
                key={col.key}
                style={{
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontWeight: 590,
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                  minWidth: col.key === "market_cap" ? "100px" : "80px",
                  textAlign: "right",
                }}
              >
                {col.label}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {peers.map((peer, peerIdx) => {
            const isSearchSymbol = peer.symbol === searchSymbol;

            return (
              <div
                key={peer.symbol}
                style={{
                  display: "flex",
                  background: isSearchSymbol
                    ? "rgba(94,106,210,0.06)"
                    : "transparent",
                  borderRadius: isSearchSymbol ? "var(--r-md)" : undefined,
                }}
              >
                {/* Frozen symbol column */}
                <div
                  style={{
                    ...stickyCellStyle,
                    minWidth: "140px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1px",
                    ...(isSearchSymbol
                      ? { background: "rgba(94,106,210,0.06)" }
                      : {}),
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 590,
                      color: isSearchSymbol ? "var(--primary)" : "var(--text-primary)",
                    }}
                  >
                    {peer.symbol}
                  </span>
                  {peer.name && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 400,
                        color: "var(--text-tertiary)",
                      }}
                    >
                      {peer.name}
                    </span>
                  )}
                </div>

                {COLUMNS.map((col) => {
                  const raw = (peer as Record<string, unknown>)[col.key] as number | undefined;
                  const val = raw !== undefined && raw !== null ? raw : null;
                  const best = bestValues[col.key];

                  const isBest =
                    val !== null &&
                    best !== null &&
                    Math.abs(val - best) < 0.0001;

                  return (
                    <div
                      key={col.key}
                      className="font-tnum"
                      style={{
                        padding: "6px 10px",
                        fontSize: "13px",
                        fontWeight: 400,
                        color: isBest ? "var(--gain)" : "var(--text-primary)",
                        whiteSpace: "nowrap",
                        minWidth: col.key === "market_cap" ? "100px" : "80px",
                        textAlign: "right",
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      {val !== null ? col.format(val, currencySymbol) : "—"}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
