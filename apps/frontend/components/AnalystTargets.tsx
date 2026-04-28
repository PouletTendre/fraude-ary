"use client";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface AnalystTargetsProps {
  data?: {
    symbol: string;
    target_high?: number;
    target_low?: number;
    target_mean?: number;
    target_median?: number;
    recommendation_mean?: number;
    recommendation_key?: string;
    number_of_analysts?: number;
  };
  currentPrice?: number;
  formatCurrency: (v: number) => string;
  isLoading?: boolean;
}

function recommendationLabel(
  key?: string,
  mean?: number,
): { label: string; color: string; bg: string } {
  if (key) {
    const lower = key.toLowerCase();
    if (lower.includes("strong_buy") || lower.includes("strong buy")) {
      return { label: "Strong Buy", color: "var(--gain)", bg: "var(--gain-muted)" };
    }
    if (lower.includes("buy")) {
      return { label: "Buy", color: "#10b981", bg: "rgba(16,185,129,0.12)" };
    }
    if (lower.includes("hold") || lower.includes("neutral")) {
      return { label: "Hold", color: "var(--text-tertiary)", bg: "rgba(255,255,255,0.06)" };
    }
    if (lower.includes("underperform") || lower.includes("sell") || lower.includes("strong_sell")) {
      return { label: "Sell", color: "var(--loss)", bg: "var(--loss-muted)" };
    }
  }
  if (mean !== undefined) {
    if (mean <= 2) return { label: "Strong Buy", color: "var(--gain)", bg: "var(--gain-muted)" };
    if (mean <= 3) return { label: "Buy", color: "#10b981", bg: "rgba(16,185,129,0.12)" };
    if (mean <= 3.5) return { label: "Hold", color: "var(--text-tertiary)", bg: "rgba(255,255,255,0.06)" };
    return { label: "Sell", color: "var(--loss)", bg: "var(--loss-muted)" };
  }
  return { label: "N/A", color: "var(--text-tertiary)", bg: "rgba(255,255,255,0.06)" };
}

export function AnalystTargets({
  data,
  currentPrice,
  formatCurrency,
  isLoading,
}: AnalystTargetsProps) {
  if (isLoading) {
    return (
      <Card style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Skeleton style={{ height: "20px", width: "45%", borderRadius: "var(--r-md)" }} />
        <Skeleton style={{ height: "16px", width: "30%", borderRadius: "var(--r-md)" }} />
        <Skeleton style={{ height: "8px", width: "100%", borderRadius: "var(--r-sm)" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Skeleton style={{ height: "12px", width: "60px", borderRadius: "var(--r-md)" }} />
          <Skeleton style={{ height: "12px", width: "60px", borderRadius: "var(--r-md)" }} />
          <Skeleton style={{ height: "12px", width: "60px", borderRadius: "var(--r-md)" }} />
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const { target_high, target_low, target_mean, target_median, recommendation_mean, recommendation_key, number_of_analysts } = data;

  const rec = recommendationLabel(recommendation_key, recommendation_mean);
  const hasTargets = target_low !== undefined || target_mean !== undefined || target_high !== undefined;

  const low = target_low ?? 0;
  const high = target_high ?? 0;
  const mean = target_mean ?? (low + high) / 2;
  const price = currentPrice ?? 0;

  const totalRange = high - low;
  const pricePct = totalRange > 0 ? Math.max(0, Math.min(100, ((price - low) / totalRange) * 100)) : 50;
  const meanPct = totalRange > 0 ? ((mean - low) / totalRange) * 100 : 50;

  const priceVsMean = mean > 0 ? ((price - mean) / mean) * 100 : 0;
  const priceColor =
    priceVsMean > 2 ? "var(--loss)" : priceVsMean < -2 ? "var(--gain)" : "var(--text-tertiary)";

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: "14px",
            fontWeight: 590,
            color: "var(--text-primary)",
          }}
        >
          Analyst Targets
        </span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 510,
            lineHeight: 1.4,
            color: rec.color,
            background: rec.bg,
            padding: "2px 10px",
            borderRadius: "var(--r-full)",
          }}
        >
          {rec.label}
        </span>
      </div>

      {number_of_analysts !== undefined && (
        <span
          style={{
            fontSize: "12px",
            fontWeight: 510,
            color: "var(--text-tertiary)",
          }}
        >
          Based on {number_of_analysts} analyst{number_of_analysts !== 1 ? "s" : ""}
        </span>
      )}

      {hasTargets && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span
              className="font-tnum"
              style={{
                fontSize: "20px",
                fontWeight: 590,
                color: priceColor,
              }}
            >
              {price ? formatCurrency(price) : "—"}
            </span>
            <span
              className="font-tnum"
              style={{
                fontSize: "13px",
                fontWeight: 510,
                color: "var(--text-primary)",
              }}
            >
              Target {formatCurrency(mean)}
            </span>
          </div>

          <div
            style={{
              position: "relative",
              height: "6px",
              borderRadius: "var(--r-sm)",
              background: "var(--surface-sunken)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "var(--r-sm)",
                background:
                  "linear-gradient(90deg, var(--loss), var(--text-tertiary), var(--gain))",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "-2px",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: priceColor,
                border: "2px solid var(--surface)",
                left: `calc(${pricePct}% - 5px)`,
                zIndex: 1,
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              fontWeight: 510,
              color: "var(--text-muted)",
            }}
          >
            <span style={{ color: "var(--loss)" }}>Low {formatCurrency(low)}</span>
            <span style={{ color: "var(--text-tertiary)" }}>Mean {formatCurrency(mean)}</span>
            <span style={{ color: "var(--gain)" }}>High {formatCurrency(high)}</span>
          </div>
        </div>
      )}

      {!hasTargets && (
        <span style={{ fontSize: "13px", fontWeight: 400, color: "var(--text-muted)" }}>
          No price targets available
        </span>
      )}
    </Card>
  );
}
