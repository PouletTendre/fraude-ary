"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAssets } from "@/hooks/useAssets";
import { useSettings } from "@/hooks/useSettings";
import { ArrowUpRight, ArrowDownRight, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

export function RecentTransactionsWidget() {
  const { assets, isLoading } = useAssets();
  const { formatCurrency, formatDate } = useSettings();

  const recentAssets = [...(assets || [])]
    .sort((a, b) => {
      const dateA = a.last_updated ? new Date(a.last_updated).getTime() : new Date(a.purchase_date).getTime();
      const dateB = b.last_updated ? new Date(b.last_updated).getTime() : new Date(b.purchase_date).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-5 h-5 text-primary" />
          Latest Transactions
        </CardTitle>
        <Link
          href="/assets"
          className="text-sm text-primary hover:underline dark:text-primary-hover flex items-center gap-1"
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {recentAssets.length > 0 ? (
          <div className="space-y-3">
            {recentAssets.map((asset) => {
              const pnl = (asset.current_price - asset.purchase_price) * asset.quantity;
              const pnlPercent = ((asset.current_price - asset.purchase_price) / asset.purchase_price) * 100;
              const isProfit = pnl >= 0;
              const displayDate = asset.last_updated || asset.purchase_date;

              return (
                <div
                  key={asset.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-surface-raised/50 hover:bg-surface-raised transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        isProfit
                          ? "bg-gain-muted text-gain dark:bg-green-900 dark:text-gain"
                          : "bg-loss-muted text-loss dark:bg-red-900 dark:text-loss"
                      )}
                    >
                      {isProfit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-text-primary">
                        {asset.symbol.toUpperCase()}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {asset.type.replace("_", " ")} • {formatDate(displayDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm text-text-primary">
                      {formatCurrency(asset.current_price * asset.quantity)}
                    </p>
                    <p
                      className={cn(
                        "text-xs font-medium",
                        isProfit ? "text-gain" : "text-loss"
                      )}
                    >
                      {isProfit ? "+" : ""}
                      {pnlPercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-text-tertiary text-center py-8 text-sm">
            No transactions yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
