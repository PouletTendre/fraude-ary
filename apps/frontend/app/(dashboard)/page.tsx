"use client";

import { useEffect, useMemo, useState } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useAssets } from "@/hooks/useAssets";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { MarketWeatherWidget } from "@/components/MarketWeatherWidget";
import { RecentTransactionsWidget } from "@/components/RecentTransactionsWidget";
import { GoalsWidget } from "@/components/GoalsWidget";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Activity, 
  ArrowRight, 
  Clock,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { portfolio, isLoading: portfolioLoading } = usePortfolio();
  const { assets, isLoading: assetsLoading } = useAssets();
  const { formatCurrency, formatDate } = useSettings();
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const isLoading = portfolioLoading || assetsLoading;

  useEffect(() => {
    if (!isLoading && (portfolio || assets)) {
      const now = new Date();
      setLastUpdate(formatDate(now));
    }
  }, [isLoading, portfolio, assets, formatDate]);

  const dailyChange = useMemo(() => {
    if (!portfolio?.history || portfolio.history.length < 2) return null;
    const history = [...portfolio.history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    const change = latest.value - previous.value;
    const percent = previous.value !== 0 ? (change / previous.value) * 100 : 0;
    return { change, percent };
  }, [portfolio?.history]);

  const topGainers = useMemo(() => {
    if (!assets || assets.length === 0) return [];
    return [...assets]
      .map(asset => ({
        ...asset,
        pnl: (asset.current_price - asset.purchase_price) * asset.quantity,
        pnlPercent: ((asset.current_price - asset.purchase_price) / asset.purchase_price) * 100,
        value: asset.current_price * asset.quantity,
      }))
      .sort((a, b) => b.pnlPercent - a.pnlPercent)
      .slice(0, 5);
  }, [assets]);

  const topLosers = useMemo(() => {
    if (!assets || assets.length === 0) return [];
    return [...assets]
      .map(asset => ({
        ...asset,
        pnl: (asset.current_price - asset.purchase_price) * asset.quantity,
        pnlPercent: ((asset.current_price - asset.purchase_price) / asset.purchase_price) * 100,
        value: asset.current_price * asset.quantity,
      }))
      .sort((a, b) => a.pnlPercent - b.pnlPercent)
      .slice(0, 5);
  }, [assets]);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="space-y-2">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-tertiary mt-1">Overview of your portfolio performance</p>
        </div>
        {lastUpdate && (
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <Clock className="w-4 h-4" />
            <span>{lastUpdate}</span>
          </div>
        )}
      </div>

      {/* Hero Section - Total Portfolio Value */}
      <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-none text-white">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Valeur totale du portfolio</p>
              <p className="text-4xl md:text-5xl font-bold tracking-tight">
                {portfolio ? formatCurrency(portfolio.total_value) : formatCurrency(0)}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <div className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium",
                  portfolio && portfolio.total_gain_loss >= 0 
                    ? "bg-green-500/20 text-green-100" 
                    : "bg-red-500/20 text-red-100"
                )}>
                  {portfolio && portfolio.total_gain_loss >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {portfolio ? `${portfolio.total_gain_loss >= 0 ? "+" : ""}${formatCurrency(portfolio.total_gain_loss)}` : formatCurrency(0)}
                </div>
                <span className="text-blue-200 text-sm">
                  ({portfolio ? `${portfolio.gain_loss_percentage >= 0 ? "+" : ""}${portfolio.gain_loss_percentage.toFixed(2)}%` : "0.00%"})
                </span>
              </div>
            </div>
            
            {/* Performance du jour */}
            <div className="bg-surface/10 backdrop-blur-sm rounded-xl p-4 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-blue-200" />
                <p className="text-blue-100 text-sm font-medium">Performance du jour</p>
              </div>
              {dailyChange ? (
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-2xl font-bold",
                    dailyChange.change >= 0 ? "text-green-300" : "text-red-300"
                  )}>
                    {dailyChange.change >= 0 ? "+" : ""}{formatCurrency(dailyChange.change)}
                  </span>
                  <span className={cn(
                    "text-sm font-medium px-2 py-0.5 rounded-full",
                    dailyChange.percent >= 0 
                      ? "bg-green-500/20 text-green-200" 
                      : "bg-red-500/20 text-red-200"
                  )}>
                    {dailyChange.percent >= 0 ? "+" : ""}{dailyChange.percent.toFixed(2)}%
                  </span>
                </div>
              ) : (
                <p className="text-blue-200 text-sm">Données insuffisantes</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-tertiary">Total Assets</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {assets?.length || 0}
                </p>
                <p className="text-sm text-text-tertiary mt-1">actifs détenus</p>
              </div>
              <div className="p-3 bg-primary-subtle rounded-full">
                <PieChart className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-tertiary">Gain/Loss Total</p>
                <p className={cn(
                  "text-2xl font-bold mt-1",
                  portfolio && portfolio.total_gain_loss >= 0 ? "text-gain" : "text-loss"
                )}>
                  {portfolio ? `${portfolio.total_gain_loss >= 0 ? "+" : ""}${formatCurrency(portfolio.total_gain_loss)}` : formatCurrency(0)}
                </p>
                <p className="text-sm text-text-tertiary mt-1">all time</p>
              </div>
              <div className={cn(
                "p-3 rounded-full",
                portfolio && portfolio.total_gain_loss >= 0 ? "bg-gain-muted" : "bg-loss-muted"
              )}>
                {portfolio && portfolio.total_gain_loss >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-gain" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-loss" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-tertiary">Performance</p>
                <p className={cn(
                  "text-2xl font-bold mt-1",
                  portfolio && portfolio.gain_loss_percentage >= 0 ? "text-gain" : "text-loss"
                )}>
                  {portfolio ? `${portfolio.gain_loss_percentage >= 0 ? "+" : ""}${portfolio.gain_loss_percentage.toFixed(2)}%` : "0.00%"}
                </p>
                <p className={cn(
                  "text-sm mt-1",
                  portfolio && portfolio.gain_loss_percentage >= 0 ? "text-gain" : "text-loss"
                )}>
                  {portfolio && portfolio.gain_loss_percentage >= 0 ? "↑ En hausse" : "↓ En baisse"}
                </p>
              </div>
              <div className={cn(
                "p-3 rounded-full",
                portfolio && portfolio.gain_loss_percentage >= 0 ? "bg-gain-muted" : "bg-loss-muted"
              )}>
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Widgets: Market Weather, Recent Transactions, Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MarketWeatherWidget />
        <RecentTransactionsWidget />
        <GoalsWidget />
      </div>

      {/* Top Gainers & Losers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gain" />
              Top Gainers
            </CardTitle>
            <Link href="/portfolio" className="text-sm text-primary hover:underline dark:text-primary-hover flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {topGainers.length > 0 ? (
              <div className="space-y-3">
                {topGainers.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between py-2 border-b border-border border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-8 rounded-full",
                        asset.type === "crypto" && "bg-amber-500",
                        asset.type === "stocks" && "bg-emerald-500",
                        asset.type === "real_estate" && "bg-indigo-500"
                      )} />
                      <div>
                        <p className="font-medium text-text-primary">{asset.symbol.toUpperCase()}</p>
                        <p className="text-xs text-text-tertiary capitalize">{asset.type.replace("_", " ")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-text-primary">{formatCurrency(asset.value)}</p>
                      <p className="text-sm text-gain font-medium">
                        +{asset.pnlPercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-tertiary text-center py-8">No assets yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-loss" />
              Top Losers
            </CardTitle>
            <Link href="/portfolio" className="text-sm text-primary hover:underline dark:text-primary-hover flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {topLosers.length > 0 ? (
              <div className="space-y-3">
                {topLosers.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between py-2 border-b border-border border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-8 rounded-full",
                        asset.type === "crypto" && "bg-amber-500",
                        asset.type === "stocks" && "bg-emerald-500",
                        asset.type === "real_estate" && "bg-indigo-500"
                      )} />
                      <div>
                        <p className="font-medium text-text-primary">{asset.symbol.toUpperCase()}</p>
                        <p className="text-xs text-text-tertiary capitalize">{asset.type.replace("_", " ")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-text-primary">{formatCurrency(asset.value)}</p>
                      <p className="text-sm text-loss font-medium">
                        {asset.pnlPercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-tertiary text-center py-8">No assets yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Asset Allocation */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Répartition par type d&apos;actif</CardTitle>
          <Link href="/portfolio" className="text-sm text-primary hover:underline dark:text-primary-hover flex items-center gap-1">
            View details <ArrowRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {portfolio?.by_type && portfolio.by_type.length > 0 ? (
            <div className="space-y-4">
              {portfolio.by_type.map((item) => (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      item.type === "crypto" && "bg-amber-500",
                      item.type === "stocks" && "bg-emerald-500",
                      item.type === "real_estate" && "bg-indigo-500"
                    )} />
                    <span className="capitalize text-text-secondary">{item.type.replace("_", " ")}</span>
                  </div>
                  <div className="flex items-center gap-4 flex-1 mx-4">
                    <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          item.type === "crypto" && "bg-amber-500",
                          item.type === "stocks" && "bg-emerald-500",
                          item.type === "real_estate" && "bg-indigo-500"
                        )}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right min-w-[120px]">
                    <span className="font-medium text-text-primary">{formatCurrency(item.value)}</span>
                    <span className="text-text-tertiary ml-2">({item.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-tertiary text-center py-8">No allocation data available</p>
          )}
        </CardContent>
      </Card>
    </div>
    </PageTransition>
  );
}
