"use client";

import { useEffect, useState } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useAssets } from "@/hooks/useAssets";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export default function DashboardPage() {
  const { portfolio, isLoading: portfolioLoading } = usePortfolio();
  const { assets, isLoading: assetsLoading } = useAssets();
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const isLoading = portfolioLoading || assetsLoading;

  useEffect(() => {
    if (!isLoading && (portfolio || assets)) {
      const now = new Date();
      setLastUpdate(now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    }
  }, [isLoading, portfolio, assets]);

  const getTimeSinceUpdate = () => {
    if (!lastUpdate) return null;
    return `Dernière mise à jour: ${lastUpdate}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Portfolio Value",
      value: portfolio ? `$${formatCurrency(portfolio.total_value)}` : "$0.00",
      icon: DollarSign,
      trend: portfolio?.total_gain_loss,
      trendPercent: portfolio?.gain_loss_percentage,
    },
    {
      label: "Total Assets",
      value: assets?.length || 0,
      icon: PieChart,
      suffix: "assets",
    },
    {
      label: "Gain/Loss",
      value: portfolio ? `${portfolio.total_gain_loss >= 0 ? "+" : ""}$${formatCurrency(portfolio.total_gain_loss)}` : "$0.00",
      icon: portfolio && portfolio.total_gain_loss >= 0 ? TrendingUp : TrendingDown,
      isPositive: portfolio ? portfolio.total_gain_loss >= 0 : true,
    },
    {
      label: "Performance",
      value: portfolio ? `${portfolio.gain_loss_percentage >= 0 ? "+" : ""}${portfolio.gain_loss_percentage.toFixed(2)}%` : "0.00%",
      icon: Activity,
      isPositive: portfolio ? portfolio.gain_loss_percentage >= 0 : true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of your portfolio performance</p>
        </div>
        {lastUpdate && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{lastUpdate}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className={cn(
                    "text-2xl font-bold mt-1",
                    stat.isPositive !== undefined 
                      ? stat.isPositive ? "text-green-600" : "text-red-600"
                      : "text-gray-900 dark:text-gray-100"
                  )}>
                    {stat.value}
                  </p>
                  {stat.trend !== undefined && (
                    <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
                      {stat.trendPercent?.toFixed(2)}% all time
                    </p>
                  )}
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <stat.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Asset Allocation</CardTitle>
            <Link href="/portfolio" className="text-sm text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1">
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
                      <span className="capitalize text-gray-700 dark:text-gray-300">{item.type.replace("_", " ")}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-gray-900 dark:text-gray-100">${formatCurrency(item.value)}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">({item.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No allocation data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Assets</CardTitle>
            <Link href="/assets" className="text-sm text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {assets && assets.length > 0 ? (
              <div className="space-y-3">
                {assets.slice(0, 5).map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{asset.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{asset.symbol || asset.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-gray-100">${formatCurrency(asset.current_price * asset.quantity)}</p>
                      <p className={cn(
                        "text-sm",
                        (asset.current_price - asset.purchase_price) >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {((asset.current_price - asset.purchase_price) / asset.purchase_price * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No assets yet</p>
                <Link href="/assets" className="text-blue-600 hover:underline dark:text-blue-400">
                  Add your first asset
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
