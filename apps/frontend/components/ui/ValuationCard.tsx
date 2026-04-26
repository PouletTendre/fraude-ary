"use client";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useValuation } from "@/hooks/useValuation";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

function labelBadge(label: string): { label: string; variant: "gain" | "loss" | "warning" } {
  switch (label) {
    case "undervalued":
      return { label: "Undervalued", variant: "gain" };
    case "overvalued":
      return { label: "Overvalued", variant: "loss" };
    case "fairly_valued":
      return { label: "Fairly Valued", variant: "warning" };
    default:
      return { label, variant: "warning" };
  }
}

function marginPctColor(pct: number): string {
  if (pct > 0) return "text-gain";
  if (pct < 0) return "text-loss";
  return "text-warning";
}

function marginPctSign(pct: number): string {
  if (pct > 0) return "+";
  return "";
}

function ScenarioBar({
  scenarios,
  marketPrice,
  marginPct,
  formatCurrency,
  currency,
}: {
  scenarios: { bear: number; base: number; bull: number };
  marketPrice: number;
  marginPct: number;
  formatCurrency: (value: number, currency?: string) => string;
  currency: string;
}) {
  const totalRange = scenarios.bull - scenarios.bear;
  const marketPosPct = totalRange > 0
    ? Math.max(0, Math.min(100, ((marketPrice - scenarios.bear) / totalRange) * 100))
    : 50;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">Scenarios</span>
        <span className={cn("text-sm font-semibold font-tnum", marginPctColor(marginPct))}>
          {marginPctSign(marginPct)}{marginPct.toFixed(1)}% {marginPct > 0 ? "undervalued" : marginPct < 0 ? "overvalued" : "fair"}
        </span>
      </div>

      <div className="relative h-3 rounded-full bg-surface-sunken overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${marketPosPct}%`,
            background: "linear-gradient(90deg, var(--gain), var(--warning), var(--loss))",
            backgroundSize: "100% 100%",
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white dark:bg-gray-100 border-2 border-surface shadow-md transition-all duration-500"
          style={{ left: `calc(${marketPosPct}% - 8px)` }}
        />
      </div>

      <div className="flex justify-between text-[10px] font-tnum text-text-muted">
        <span className="text-gain font-medium">{formatCurrency(scenarios.bear, currency)}</span>
        <span className="text-warning font-medium">{formatCurrency(scenarios.base, currency)}</span>
        <span className="text-loss font-medium">{formatCurrency(scenarios.bull, currency)}</span>
      </div>
      <div className="flex justify-between text-[9px] text-text-muted -mt-2">
        <span>Bear</span>
        <span>Base</span>
        <span>Bull</span>
      </div>
    </div>
  );
}

export function ValuationCard({ symbol }: { symbol: string }) {
  const { formatCurrency } = useSettings();
  const { data, isLoading, error } = useValuation(symbol);

  if (!symbol) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-text-muted" />
            <CardTitle>Stock Valuation</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-text-tertiary">Enter a symbol to see valuation</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-4 w-40" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-text-muted" />
            <CardTitle>Stock Valuation</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-text-tertiary">
            Failed to load valuation data for {symbol}. Please verify the symbol.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const badge = labelBadge(data.label);
  const mktFmt = formatCurrency(data.market_price, data.currency);
  const ivFmt = formatCurrency(data.intrinsic_value, data.currency);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-text-secondary" />
            <CardTitle>Stock Valuation — {data.symbol}</CardTitle>
            {data.is_estimated && (
              <Badge variant="info">Estimated</Badge>
            )}
          </div>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Three stat columns */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-[var(--r-md)] bg-surface-sunken p-3 text-center">
            <p className="text-[11px] text-text-muted mb-1">Market Price</p>
            <p className="text-lg font-bold font-tnum text-text-primary">{mktFmt}</p>
          </div>
          <div className="rounded-[var(--r-md)] bg-surface-sunken p-3 text-center">
            <p className="text-[11px] text-text-muted mb-1">Intrinsic Value</p>
            <p className="text-lg font-bold font-tnum text-text-primary">{ivFmt}</p>
          </div>
          <div className="rounded-[var(--r-md)] bg-surface-sunken p-3 text-center">
            <p className="text-[11px] text-text-muted mb-1">Margin of Safety</p>
            <p className={cn("text-lg font-bold font-tnum", marginPctColor(data.margin_pct))}>
              {marginPctSign(data.margin_pct)}{data.margin_pct.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Valuation Methods */}
        {data.methods.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-text-secondary">Valuation Methods</span>
            <div className="space-y-[6px]">
              {data.methods.map((method) => (
                <div
                  key={method.method}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-text-tertiary">{method.method}</span>
                  <div className="flex items-center gap-2 font-tnum">
                    <span className="text-text-primary">{formatCurrency(method.intrinsic_value, data.currency)}</span>
                    <span className={cn("text-xs font-medium", marginPctColor(method.margin_pct))}>
                      ({marginPctSign(method.margin_pct)}{method.margin_pct.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scenario Bar */}
        <ScenarioBar
          scenarios={data.scenarios}
          marketPrice={data.market_price}
          marginPct={data.margin_pct}
          formatCurrency={formatCurrency}
          currency={data.currency}
        />
      </CardContent>
    </Card>
  );
}
