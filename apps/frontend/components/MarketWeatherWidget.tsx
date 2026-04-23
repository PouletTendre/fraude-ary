"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { TrendingUp, TrendingDown, Minus, Globe, BarChart3, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketIndicator {
  name: string;
  status: "bullish" | "bearish" | "neutral";
  trend: string;
  description: string;
}

function getMarketIndicators(): MarketIndicator[] {
  const indicators: MarketIndicator[] = [
    {
      name: "Global Market",
      status: "bullish",
      trend: "+1.2%",
      description: "Positive momentum across major indices",
    },
    {
      name: "Crypto Market",
      status: "bullish",
      trend: "+3.8%",
      description: "BTC and ETH showing strong recovery",
    },
    {
      name: "Tech Stocks",
      status: "neutral",
      trend: "+0.1%",
      description: "Sideways movement with low volatility",
    },
    {
      name: "Real Estate",
      status: "bearish",
      trend: "-0.5%",
      description: "Cooling down due to rate concerns",
    },
    {
      name: "Commodities",
      status: "bullish",
      trend: "+2.1%",
      description: "Gold and oil prices surging",
    },
  ];
  return indicators;
}

function getStatusIcon(status: MarketIndicator["status"]) {
  switch (status) {
    case "bullish":
      return <TrendingUp className="w-4 h-4" />;
    case "bearish":
      return <TrendingDown className="w-4 h-4" />;
    default:
      return <Minus className="w-4 h-4" />;
  }
}

function getStatusColor(status: MarketIndicator["status"]) {
  switch (status) {
    case "bullish":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400 border-green-200 dark:border-green-800";
    case "bearish":
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400 border-red-200 dark:border-red-800";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600";
  }
}

export function MarketWeatherWidget() {
  const indicators = useMemo(() => getMarketIndicators(), []);

  const bullishCount = indicators.filter((i) => i.status === "bullish").length;
  const bearishCount = indicators.filter((i) => i.status === "bearish").length;

  const overallStatus = bullishCount > bearishCount ? "bullish" : bearishCount > bullishCount ? "bearish" : "neutral";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Market Weather
        </CardTitle>
        <span
          className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full border",
            overallStatus === "bullish" && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400 border-green-200 dark:border-green-800",
            overallStatus === "bearish" && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400 border-red-200 dark:border-red-800",
            overallStatus === "neutral" && "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600"
          )}
        >
          {overallStatus === "bullish" ? "Sunny" : overallStatus === "bearish" ? "Stormy" : "Cloudy"}
        </span>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {indicators.map((indicator) => (
            <div
              key={indicator.name}
              className={cn(
                "flex items-center justify-between p-2.5 rounded-lg border transition-colors",
                getStatusColor(indicator.status)
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-white/50 dark:bg-black/20">
                  {indicator.name === "Global Market" && <BarChart3 className="w-3.5 h-3.5" />}
                  {indicator.name === "Crypto Market" && <Activity className="w-3.5 h-3.5" />}
                  {indicator.name === "Tech Stocks" && <TrendingUp className="w-3.5 h-3.5" />}
                  {indicator.name === "Real Estate" && <TrendingDown className="w-3.5 h-3.5" />}
                  {indicator.name === "Commodities" && <Globe className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{indicator.name}</p>
                  <p className="text-xs opacity-80">{indicator.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                {getStatusIcon(indicator.status)}
                <span>{indicator.trend}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
