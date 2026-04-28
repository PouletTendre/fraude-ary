"use client";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useState, useMemo } from "react";

interface FinancialStatementsProps {
  data?: {
    symbol: string;
    annual_income: Record<string, number>[];
    annual_balance: Record<string, number>[];
    annual_cashflow: Record<string, number>[];
    quarterly_income: Record<string, number>[];
    quarterly_balance: Record<string, number>[];
    quarterly_cashflow: Record<string, number>[];
  };
  isLoading?: boolean;
}

type Period = "annual" | "quarterly";
type StatementType = "income" | "balance" | "cashflow";

function formatLargeNumber(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

const STATEMENT_LABELS: Record<StatementType, string> = {
  income: "Income",
  balance: "Balance Sheet",
  cashflow: "Cash Flow",
};

const TABS: StatementType[] = ["income", "balance", "cashflow"];

function getStatements(
  data: FinancialStatementsProps["data"],
  period: Period,
  type: StatementType,
): Record<string, number>[] {
  if (!data) return [];
  const field = `${period}_${type}` as keyof typeof data;
  return (data[field] as Record<string, number>[]) ?? [];
}

function extractPeriods(rows: Record<string, number>[]): string[] {
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]);
  return keys.filter((k) => k !== "date" && (k.startsWith("20") || k.includes("-")));
}

function extractLineItems(rows: Record<string, number>[]): string[] {
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]);
  return keys.filter(
    (k) => k !== "date" && !k.startsWith("20") && !k.includes("-") && k !== "symbol",
  );
}

function formatDateLabel(dateStr: string): string {
  const digits = dateStr.replace(/\D/g, "");
  if (digits.length >= 6) {
    const y = digits.slice(0, 4);
    const m = digits.slice(4, 6);
    return `${y}-${m}`;
  }
  return dateStr;
}

export function FinancialStatements({ data, isLoading }: FinancialStatementsProps) {
  const [period, setPeriod] = useState<Period>("annual");
  const [tab, setTab] = useState<StatementType>("income");

  if (isLoading) {
    return (
      <Card style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <Skeleton style={{ height: "28px", width: "70px", borderRadius: "var(--r-btn)" }} />
          <Skeleton style={{ height: "28px", width: "70px", borderRadius: "var(--r-btn)" }} />
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <Skeleton style={{ height: "28px", width: "80px", borderRadius: "var(--r-btn)" }} />
          <Skeleton style={{ height: "28px", width: "100px", borderRadius: "var(--r-btn)" }} />
          <Skeleton style={{ height: "28px", width: "90px", borderRadius: "var(--r-btn)" }} />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
            <Skeleton style={{ height: "14px", width: `${30 + Math.random() * 30}%`, borderRadius: "var(--r-md)" }} />
            <Skeleton style={{ height: "14px", width: "15%", borderRadius: "var(--r-md)" }} />
            <Skeleton style={{ height: "14px", width: "15%", borderRadius: "var(--r-md)" }} />
            <Skeleton style={{ height: "14px", width: "15%", borderRadius: "var(--r-md)" }} />
          </div>
        ))}
      </Card>
    );
  }

  if (!data) return null;

  const statements = getStatements(data, period, tab);
  const periodColumns = useMemo(() => extractPeriods(statements), [statements]);
  const lineItems = useMemo(() => extractLineItems(statements), [statements]);

  const periodValues: Record<string, Record<string, number>> = {};

  if (statements.length) {
    for (const row of statements) {
      const dateKey = periodColumns.find((p) => row[p] !== undefined);
      if (!dateKey) continue;
      for (const item of lineItems) {
        if (row[item] !== undefined) {
          if (!periodValues[dateKey]) periodValues[dateKey] = {};
          periodValues[dateKey][item] = row[item];
        }
      }
    }
  }

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    fontSize: "12px",
    fontWeight: 510,
    lineHeight: 1.4,
    padding: "4px 12px",
    borderRadius: "var(--r-btn)",
    border: "1px solid var(--border)",
    background: active ? "rgba(255,255,255,0.08)" : "transparent",
    color: active ? "var(--text-primary)" : "var(--text-tertiary)",
    cursor: "pointer",
    transition: "background 0.15s ease, color 0.15s ease",
  });

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Period toggle */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => setPeriod("annual")}
          style={toggleStyle(period === "annual")}
        >
          Annual
        </button>
        <button
          onClick={() => setPeriod("quarterly")}
          style={toggleStyle(period === "quarterly")}
        >
          Quarterly
        </button>
      </div>

      {/* Statement type tabs */}
      <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontSize: "13px",
              fontWeight: 510,
              lineHeight: 1.5,
              padding: "4px 12px",
              borderRadius: "var(--r-md)",
              background: tab === t ? "rgba(255,255,255,0.06)" : "transparent",
              color: tab === t ? "var(--text-primary)" : "var(--text-tertiary)",
              border: "none",
              cursor: "pointer",
            }}
          >
            {STATEMENT_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Table */}
      {statements.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "6px 8px",
                    fontWeight: 510,
                    fontSize: "12px",
                    color: "var(--text-tertiary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Line item
                </th>
                {periodColumns.map((col) => (
                  <th
                    key={col}
                    className="font-tnum"
                    style={{
                      textAlign: "right",
                      padding: "6px 8px",
                      fontWeight: 510,
                      fontSize: "12px",
                      color: "var(--text-tertiary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDateLabel(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr
                  key={item}
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <td
                    style={{
                      padding: "6px 8px",
                      fontWeight: 400,
                      color: "var(--text-secondary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).replace(/_/g, " ")}
                  </td>
                  {periodColumns.map((col) => {
                    const val = periodValues[col]?.[item];
                    const isNegative = val !== undefined && val < 0;
                    return (
                      <td
                        key={col}
                        className="font-tnum"
                        style={{
                          textAlign: "right",
                          padding: "6px 8px",
                          fontWeight: 400,
                          color: isNegative ? "var(--loss)" : "var(--text-primary)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {val !== undefined ? formatLargeNumber(val) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <span
          style={{
            fontSize: "13px",
            fontWeight: 400,
            color: "var(--text-muted)",
            textAlign: "center",
            padding: "24px 0",
          }}
        >
          No {STATEMENT_LABELS[tab].toLowerCase()} data available
        </span>
      )}
    </Card>
  );
}
