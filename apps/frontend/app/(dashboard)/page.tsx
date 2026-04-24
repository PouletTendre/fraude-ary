"use client";

import { useEffect, useMemo, useState } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useAssets } from "@/hooks/useAssets";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { KPICard } from "@/components/ui/KPICard";
import { TimeFilterChips } from "@/components/ui/TimeFilterChips";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { Badge } from "@/components/ui/Badge";
import { Tag } from "@/components/ui/Tag";
import { AssetAvatar } from "@/components/ui/AssetAvatar";
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
  const { formatCurrency } = useSettings();
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState("1M");

  const isLoading = portfolioLoading || assetsLoading;

  useEffect(() => {
    if (!isLoading && (portfolio || assets)) {
      const now = new Date();
      setLastUpdate(now.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }));
    }
  }, [isLoading, portfolio, assets]);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-[110px] rounded-lg" />
            <Skeleton className="h-[110px] rounded-lg" />
            <Skeleton className="h-[110px] rounded-lg" />
            <Skeleton className="h-[110px] rounded-lg" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-72 rounded-lg" />
            <Skeleton className="h-72 rounded-lg" />
            <Skeleton className="h-72 rounded-lg" />
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-display text-text-primary">Portfolio Dashboard</h1>
          <p className="text-body text-text-secondary mt-1">Vue d&apos;ensemble de vos performances</p>
        </div>
        {lastUpdate && (
          <div className="flex items-center gap-2 text-body-sm text-text-tertiary">
            <Clock className="w-4 h-4" />
            <span>{lastUpdate}</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="VALEUR TOTALE"
          value={portfolio ? formatCurrency(portfolio.total_value) : formatCurrency(0)}
          delta={portfolio ? `${portfolio.gain_loss_percentage >= 0 ? "+" : ""}${portfolio.gain_loss_percentage.toFixed(2)}% ce mois` : undefined}
          isPositive={portfolio ? portfolio.gain_loss_percentage >= 0 : null}
        />
        <KPICard
          label="P&L JOURNALIER"
          value={dailyChange ? `${dailyChange.change >= 0 ? "+" : ""}${formatCurrency(dailyChange.change)}` : "—"}
          delta={dailyChange ? `${dailyChange.percent >= 0 ? "+" : ""}${dailyChange.percent.toFixed(2)}%` : undefined}
          isPositive={dailyChange ? dailyChange.change >= 0 : null}
        />
        <KPICard
          label="BETA"
          value="0.87"
          delta="neutre"
          isPositive={null}
        />
        <KPICard
          label="SHARPE RATIO"
          value="1.62"
          delta="bon"
          isPositive={true}
        />
      </div>

      {/* Time filter + widgets */}
      <div className="flex items-center justify-between">
        <TimeFilterChips value={timeFilter} onChange={setTimeFilter} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MarketWeatherWidget />
        <RecentTransactionsWidget />
        <GoalsWidget />
      </div>

      {/* Top Gainers & Losers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-h2">
              <TrendingUp className="w-5 h-5 text-gain" />
              Top Gainers
            </CardTitle>
            <Link href="/portfolio" className="text-body-sm text-primary hover:text-primary-hover flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {topGainers.length > 0 ? (
              <div className="space-y-3">
                {topGainers.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <AssetAvatar symbol={asset.symbol} type={asset.type === "crypto" ? "crypto" : "equity"} />
                      <div>
                        <p className="font-medium text-text-primary text-[13px]">{asset.symbol.toUpperCase()}</p>
                        <p className="text-label text-text-tertiary uppercase tracking-wide">{asset.type.replace("_", " ")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[13px] text-text-primary font-tnum">{formatCurrency(asset.value)}</p>
                      <Badge variant="gain">
                        ▲ +{asset.pnlPercent.toFixed(2)}%
                      </Badge>
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
            <CardTitle className="flex items-center gap-2 text-h2">
              <TrendingDown className="w-5 h-5 text-loss" />
              Top Losers
            </CardTitle>
            <Link href="/portfolio" className="text-body-sm text-primary hover:text-primary-hover flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {topLosers.length > 0 ? (
              <div className="space-y-3">
                {topLosers.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <AssetAvatar symbol={asset.symbol} type={asset.type === "crypto" ? "crypto" : "equity"} />
                      <div>
                        <p className="font-medium text-text-primary text-[13px]">{asset.symbol.toUpperCase()}</p>
                        <p className="text-label text-text-tertiary uppercase tracking-wide">{asset.type.replace("_", " ")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[13px] text-text-primary font-tnum">{formatCurrency(asset.value)}</p>
                      <Badge variant="loss">
                        ▼ {asset.pnlPercent.toFixed(2)}%
                      </Badge>
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
          <CardTitle className="text-h2">Répartition par type d&apos;actif</CardTitle>
          <Link href="/portfolio" className="text-body-sm text-primary hover:text-primary-hover flex items-center gap-1">
            View details <ArrowRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {portfolio?.by_type && portfolio.by_type.length > 0 ? (
            <div className="space-y-4">
              {portfolio.by_type.map((item) => (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-[120px]">
                    <span className="capitalize text-text-secondary text-body-sm">{item.type.replace("_", " ")}</span>
                  </div>
                  <div className="flex items-center gap-4 flex-1 mx-4">
                    <div className="w-[80px] h-[6px] bg-border rounded-full overflow-hidden flex-shrink-0">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-text-tertiary font-tnum w-[50px] text-right">{item.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="text-right min-w-[120px]">
                    <span className="font-mono text-body-sm text-text-primary font-tnum">{formatCurrency(item.value)}</span>
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
