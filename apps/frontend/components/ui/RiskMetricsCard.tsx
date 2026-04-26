"use client";
import { cn } from "@/lib/utils";
import { usePortfolioAnalytics } from "@/hooks/usePortfolioAnalytics";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";

function fmtPct(val: number | null): string {
  if (val === null || val === undefined) return "--";
  return `${val >= 0 ? "+" : ""}${val.toFixed(1)}%`;
}

function ratioColor(val: number | null): string {
  if (val === null || val === undefined) return "text-text-tertiary";
  return val >= 0 ? "text-gain" : "text-loss";
}

interface MetricCellProps {
  label: string;
  value: string;
  valueColor?: string;
  sub?: string;
}

function MetricCell({ label, value, valueColor, sub }: MetricCellProps) {
  return (
    <div className="flex flex-col items-center p-3">
      <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
        {label}
      </span>
      <span className={cn("text-lg font-bold font-tnum mt-1", valueColor || "text-text-primary")}>
        {value}
      </span>
      {sub && <span className="text-[10px] text-text-tertiary font-tnum">{sub}</span>}
    </div>
  );
}

export function RiskMetricsCard() {
  const { data: analytics, isLoading, error } = usePortfolioAnalytics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk & Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center p-3 space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-14" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk & Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-tertiary py-4 text-center">
            Analytics data unavailable
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Risk & Performance</CardTitle>
          {analytics.sharpe_ratio !== null && (
            <Badge variant={analytics.sharpe_ratio >= 1 ? "gain" : analytics.sharpe_ratio >= 0 ? "warning" : "loss"}>
              {analytics.sharpe_ratio >= 1 ? "Good" : analytics.sharpe_ratio >= 0 ? "Moderate" : "Poor"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-y-3 border-b border-border pb-3">
          <MetricCell
            label="Sharpe Ratio"
            value={analytics.sharpe_ratio !== null ? analytics.sharpe_ratio.toFixed(2) : "--"}
            valueColor={ratioColor(analytics.sharpe_ratio)}
          />
          <MetricCell
            label="Max Drawdown"
            value={fmtPct(analytics.max_drawdown)}
            valueColor={analytics.max_drawdown !== null ? "text-loss" : undefined}
          />
          <MetricCell
            label="Volatility"
            value={analytics.volatility_annual !== null ? `${(analytics.volatility_annual * 100).toFixed(1)}%` : "--"}
            valueColor="text-text-primary"
          />
        </div>
        <div className="grid grid-cols-3 gap-y-3 pt-3">
          <MetricCell
            label="Sortino"
            value={analytics.sortino_ratio !== null ? analytics.sortino_ratio.toFixed(2) : "--"}
            valueColor={ratioColor(analytics.sortino_ratio)}
          />
          <MetricCell
            label="VaR 95%"
            value={fmtPct(analytics.var_95)}
            valueColor={analytics.var_95 !== null ? "text-loss" : undefined}
          />
          <MetricCell
            label="CVaR 95%"
            value={fmtPct(analytics.cvar_95)}
            valueColor={analytics.cvar_95 !== null ? "text-loss" : undefined}
          />
        </div>
        {(analytics.daily_return !== null || analytics.weekly_return !== null || analytics.monthly_return !== null) && (
          <div className="mt-4 pt-3 border-t border-border grid grid-cols-3 gap-2">
            <MetricCell
              label="Daily"
              value={fmtPct(analytics.daily_return)}
              valueColor={analytics.daily_return !== null ? (analytics.daily_return >= 0 ? "text-gain" : "text-loss") : undefined}
            />
            <MetricCell
              label="Weekly"
              value={fmtPct(analytics.weekly_return)}
              valueColor={analytics.weekly_return !== null ? (analytics.weekly_return >= 0 ? "text-gain" : "text-loss") : undefined}
            />
            <MetricCell
              label="Monthly"
              value={fmtPct(analytics.monthly_return)}
              valueColor={analytics.monthly_return !== null ? (analytics.monthly_return >= 0 ? "text-gain" : "text-loss") : undefined}
            />
          </div>
        )}
        {(analytics.best_day || analytics.worst_day) && (
          <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-2">
            {analytics.best_day && (
              <MetricCell
                label="Best Day"
                value={fmtPct(analytics.best_day.return_pct)}
                valueColor="text-gain"
                sub={analytics.best_day.date.slice(0, 10)}
              />
            )}
            {analytics.worst_day && (
              <MetricCell
                label="Worst Day"
                value={fmtPct(analytics.worst_day.return_pct)}
                valueColor="text-loss"
                sub={analytics.worst_day.date.slice(0, 10)}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
