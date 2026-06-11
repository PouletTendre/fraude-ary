"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { Asset } from "@/types";

interface EnrichedAsset extends Asset {
  pnlPercent: number;
  value: number;
  allocation: number;
  dailyChange24h: string;
}

interface DashboardTableProps {
  assets: EnrichedAsset[];
  formatCurrency: (value: number, currency?: string) => string;
}

const TYPE_LABELS: Record<string, string> = {
  stocks: "Action",
  crypto: "Crypto",
  real_estate: "Immobilier",
  etf: "ETF",
  bond: "Obligation",
  cash: "Liquidités",
};

export function DashboardTable({
  assets,
  formatCurrency,
}: DashboardTableProps) {
  if (assets.length === 0) {
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-panel)",
          padding: "48px 24px",
          textAlign: "center",
          color: "var(--text-tertiary)",
          fontSize: "14px",
        }}
      >
        Aucun actif. Ajoutez votre premier actif pour commencer.
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-panel)",
        overflow: "hidden",
      }}
    >
      {/* Table header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 590,
            color: "var(--text-primary)",
          }}
        >
          Positions
        </span>
        <span
          style={{
            fontSize: "11px",
            color: "var(--text-tertiary)",
          }}
        >
          {assets.length} actif{assets.length > 1 ? "s" : ""}
        </span>
      </div>

      <table
        className="w-full"
        style={{ borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th
              className="text-label-medium"
              style={{
                textAlign: "left",
                padding: "10px 20px",
                color: "var(--text-tertiary)",
                borderBottom: "1px solid var(--border-subtle)",
                fontSize: "11px",
                fontWeight: 510,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Symbole
            </th>
            <th
              className="text-label-medium"
              style={{
                textAlign: "left",
                padding: "10px 12px",
                color: "var(--text-tertiary)",
                borderBottom: "1px solid var(--border-subtle)",
                fontSize: "11px",
                fontWeight: 510,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Type
            </th>
            <th
              className="text-label-medium"
              style={{
                textAlign: "right",
                padding: "10px 12px",
                color: "var(--text-tertiary)",
                borderBottom: "1px solid var(--border-subtle)",
                fontSize: "11px",
                fontWeight: 510,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Prix
            </th>
            <th
              className="text-label-medium"
              style={{
                textAlign: "right",
                padding: "10px 12px",
                color: "var(--text-tertiary)",
                borderBottom: "1px solid var(--border-subtle)",
                fontSize: "11px",
                fontWeight: 510,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              24h
            </th>
            <th
              className="text-label-medium"
              style={{
                textAlign: "right",
                padding: "10px 12px",
                color: "var(--text-tertiary)",
                borderBottom: "1px solid var(--border-subtle)",
                fontSize: "11px",
                fontWeight: 510,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Valeur
            </th>
            <th
              className="text-label-medium"
              style={{
                textAlign: "right",
                padding: "10px 20px",
                color: "var(--text-tertiary)",
                borderBottom: "1px solid var(--border-subtle)",
                fontSize: "11px",
                fontWeight: 510,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Alloc.
            </th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => {
            const isGain = asset.pnlPercent >= 0;
            return (
              <tr
                key={asset.id}
                style={{
                  borderBottom: "1px solid var(--border-subtle)",
                  transition: "background 120ms ease-out",
                }}
                className="hover:bg-surface-raised"
              >
                <td
                  style={{
                    padding: "14px 20px",
                    verticalAlign: "middle",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "var(--r-md)",
                        background: asset.type === "crypto"
                          ? "rgba(247,147,26,0.12)"
                          : asset.type === "real_estate"
                          ? "rgba(16,185,129,0.12)"
                          : "rgba(94,106,210,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: 590,
                        color: asset.type === "crypto"
                          ? "#f7931a"
                          : asset.type === "real_estate"
                          ? "var(--gain)"
                          : "var(--primary)",
                        flexShrink: 0,
                      }}
                    >
                      {asset.symbol.slice(0, 2).toUpperCase()}
                    </div>
                    <span
                      className="w-510"
                      style={{
                        fontSize: "13px",
                        color: "var(--text-primary)",
                      }}
                    >
                      {asset.symbol.toUpperCase()}
                    </span>
                  </div>
                </td>

                <td style={{ padding: "14px 12px" }}>
                  <Badge variant="neutral">
                    {TYPE_LABELS[asset.type] || asset.type}
                  </Badge>
                </td>

                <td
                  className="font-mono font-tnum"
                  style={{
                    padding: "14px 12px",
                    textAlign: "right",
                    fontSize: "13px",
                    color: "var(--text-primary)",
                  }}
                >
                  {formatCurrency(asset.current_price, asset.currency)}
                </td>

                <td
                  className={cn("font-mono font-tnum")}
                  style={{
                    padding: "14px 12px",
                    textAlign: "right",
                    fontSize: "13px",
                    color: isGain ? "var(--gain)" : "var(--loss)",
                  }}
                >
                  {isGain ? "+" : ""}
                  {asset.pnlPercent.toFixed(2)}%
                </td>

                <td
                  className="font-mono font-tnum"
                  style={{
                    padding: "14px 12px",
                    textAlign: "right",
                    fontSize: "13px",
                    color: "var(--text-primary)",
                  }}
                >
                  {formatCurrency(asset.value, asset.currency)}
                </td>

                <td style={{ padding: "14px 20px", textAlign: "right" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <div
                      style={{
                        width: "64px",
                        height: "3px",
                        background: "var(--border)",
                        borderRadius: "9999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: "9999px",
                          background: "var(--primary)",
                          width: `${Math.min(asset.allocation, 100)}%`,
                          transition: "width 300ms ease-out",
                        }}
                      />
                    </div>
                    <span
                      className="font-mono font-tnum"
                      style={{
                        fontSize: "11px",
                        color: "var(--text-tertiary)",
                        minWidth: "32px",
                        textAlign: "right",
                      }}
                    >
                      {asset.allocation.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
