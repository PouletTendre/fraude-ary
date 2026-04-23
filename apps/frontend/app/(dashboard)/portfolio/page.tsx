"use client";

import { useState, useMemo } from "react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar
} from "recharts";
import { cn } from "@/lib/utils";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useAssets } from "@/hooks/useAssets";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, ArrowUpDown, ArrowUp, ArrowDown 
} from "lucide-react";

const PERIODS = [
  { value: "1D", label: "1D" },
  { value: "1W", label: "1W" },
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "1Y", label: "1Y" },
  { value: "ALL", label: "ALL" },
] as const;

type Period = typeof PERIODS[number]["value"];

const TYPE_COLORS: Record<string, string> = {
  crypto: "#F59E0B",
  stocks: "#10B981",
  real_estate: "#6366F1",
};

const TYPE_LABELS: Record<string, string> = {
  crypto: "Crypto",
  stocks: "Stocks",
  real_estate: "Real Estate",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

type SortKey = "symbol" | "type" | "quantity" | "purchase_price" | "current_price" | "value" | "pnl" | "pnlPercent";
type SortDirection = "asc" | "desc";

interface AssetRow {
  id: number;
  symbol: string;
  type: string;
  quantity: number;
  purchase_price: number;
  current_price: number;
  value: number;
  pnl: number;
  pnlPercent: number;
}

export default function PortfolioPage() {
  const { portfolio, isLoading: portfolioLoading, error } = usePortfolio();
  const { assets, isLoading: assetsLoading } = useAssets();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("1M");
  const [isLive, setIsLive] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const isLoading = portfolioLoading || assetsLoading;

  const filteredHistory = useMemo(() => {
    if (!portfolio?.history || portfolio.history.length === 0) return [];
    const now = new Date();
    const cutoffDays: Record<Period, number> = {
      "1D": 1,
      "1W": 7,
      "1M": 30,
      "3M": 90,
      "1Y": 365,
      "ALL": Infinity,
    };
    const days = cutoffDays[selectedPeriod];
    if (days === Infinity) return portfolio.history;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return portfolio.history.filter((point) => new Date(point.date) >= cutoff);
  }, [portfolio?.history, selectedPeriod]);

  const assetRows: AssetRow[] = useMemo(() => {
    if (!assets) return [];
    return assets.map(asset => ({
      id: asset.id,
      symbol: asset.symbol,
      type: asset.type,
      quantity: asset.quantity,
      purchase_price: asset.purchase_price,
      current_price: asset.current_price,
      value: asset.current_price * asset.quantity,
      pnl: (asset.current_price - asset.purchase_price) * asset.quantity,
      pnlPercent: ((asset.current_price - asset.purchase_price) / asset.purchase_price) * 100,
    }));
  }, [assets]);

  const sortedRows = useMemo(() => {
    const rows = [...assetRows];
    rows.sort((a, b) => {
      let aVal: number | string = a[sortKey];
      let bVal: number | string = b[sortKey];
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [assetRows, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> 
      : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Portfolio</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Failed to load portfolio data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Portfolio</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  ${formatCurrency(portfolio.total_value)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Gain/Loss</p>
                <p className={`text-2xl font-bold mt-1 ${portfolio.total_gain_loss >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {portfolio.total_gain_loss >= 0 ? "+" : ""}${formatCurrency(portfolio.total_gain_loss)}
                </p>
                {portfolio.total_gain_loss >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600 inline mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600 inline mr-1" />
                )}
                <span className="text-sm text-gray-500">all time</span>
              </div>
              <div className={`p-3 rounded-full ${portfolio.total_gain_loss >= 0 ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}>
                {portfolio.total_gain_loss >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Performance</p>
                <p className={`text-3xl font-bold mt-1 ${portfolio.gain_loss_percentage >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {portfolio.gain_loss_percentage >= 0 ? "+" : ""}{portfolio.gain_loss_percentage.toFixed(2)}%
                </p>
                <p className={`text-sm mt-1 ${portfolio.gain_loss_percentage >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {portfolio.gain_loss_percentage >= 0 ? "↑ En hausse" : "↓ En baisse"}
                </p>
              </div>
              <div className={`p-3 rounded-full ${portfolio.gain_loss_percentage >= 0 ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}>
                {portfolio.gain_loss_percentage >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart - Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par type d&apos;actif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolio.by_type}
                    dataKey="value"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={65}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {portfolio.by_type.map((entry) => (
                      <Cell key={entry.type} fill={TYPE_COLORS[entry.type] || "#9CA3AF"} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `$${formatCurrency(value)}`, 
                      TYPE_LABELS[name] || name
                    ]} 
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  ${formatCurrency(portfolio.total_value)}
                </p>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
              {portfolio.by_type.map((item) => (
                <div key={item.type} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[item.type] }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{item.type.replace("_", " ")}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart - Value by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Valeur par type d&apos;actif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={portfolio.by_type} layout="vertical" margin={{ top: 10, right: 10, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `$${formatCurrency(v)}`} />
                  <YAxis 
                    type="category" 
                    dataKey="type" 
                    stroke="#9CA3AF" 
                    fontSize={12} 
                    tickFormatter={(v) => TYPE_LABELS[v] || v.replace("_", " ")} 
                  />
                  <Tooltip formatter={(value: number) => `$${formatCurrency(value)}`} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                    {portfolio.by_type.map((entry) => (
                      <Cell key={entry.type} fill={TYPE_COLORS[entry.type] || "#9CA3AF"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Evolution */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Évolution du portfolio</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className={cn("w-4 h-4", isLive ? "text-green-500" : "text-gray-400")} />
                <span className={cn("text-xs font-medium", isLive ? "text-green-600 dark:text-green-400" : "text-gray-500")}>
                  {isLive ? "LIVE" : "DELAYED"}
                </span>
              </div>
              <div className="flex gap-1">
                {PERIODS.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setSelectedPeriod(period.value)}
                    className={cn(
                      "px-3 py-1 text-sm rounded-lg transition-colors",
                      selectedPeriod === period.value
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF" 
                  fontSize={12} 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
                  }}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={12} 
                  tickFormatter={(v) => `$${formatCurrency(v)}`} 
                  width={80}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${formatCurrency(value)}`, "Valeur"]}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  strokeWidth={2} 
                  fill="url(#colorValue)" 
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assets détaillés</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th 
                    className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                    onClick={() => handleSort("symbol")}
                  >
                    <div className="flex items-center gap-1">
                      Symbole
                      <SortIcon column="symbol" />
                    </div>
                  </th>
                  <th 
                    className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                    onClick={() => handleSort("type")}
                  >
                    <div className="flex items-center gap-1">
                      Type
                      <SortIcon column="type" />
                    </div>
                  </th>
                  <th 
                    className="text-right px-6 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                    onClick={() => handleSort("quantity")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Quantité
                      <SortIcon column="quantity" />
                    </div>
                  </th>
                  <th 
                    className="text-right px-6 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                    onClick={() => handleSort("purchase_price")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Prix d&apos;achat
                      <SortIcon column="purchase_price" />
                    </div>
                  </th>
                  <th 
                    className="text-right px-6 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                    onClick={() => handleSort("current_price")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Prix actuel
                      <SortIcon column="current_price" />
                    </div>
                  </th>
                  <th 
                    className="text-right px-6 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                    onClick={() => handleSort("value")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Valeur
                      <SortIcon column="value" />
                    </div>
                  </th>
                  <th 
                    className="text-right px-6 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                    onClick={() => handleSort("pnl")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      P&L
                      <SortIcon column="pnl" />
                    </div>
                  </th>
                  <th 
                    className="text-right px-6 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                    onClick={() => handleSort("pnlPercent")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      P&L %
                      <SortIcon column="pnlPercent" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.length > 0 ? (
                  sortedRows.map((row) => (
                    <tr 
                      key={row.id} 
                      className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-8 rounded-full",
                            row.type === "crypto" && "bg-amber-500",
                            row.type === "stocks" && "bg-emerald-500",
                            row.type === "real_estate" && "bg-indigo-500"
                          )} />
                          <span className="font-semibold text-gray-900 dark:text-gray-100 uppercase">
                            {row.symbol}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 capitalize">
                          {row.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900 dark:text-gray-100">
                        {row.quantity}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">
                        ${formatCurrency(row.purchase_price)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900 dark:text-gray-100 font-medium">
                        ${formatCurrency(row.current_price)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900 dark:text-gray-100 font-medium">
                        ${formatCurrency(row.value)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          "font-medium",
                          row.pnl >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {row.pnl >= 0 ? "+" : ""}${formatCurrency(row.pnl)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          "inline-flex items-center gap-1 font-medium",
                          row.pnlPercent >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {row.pnlPercent >= 0 ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                          )}
                          {row.pnlPercent >= 0 ? "+" : ""}{row.pnlPercent.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      Aucun actif dans le portfolio
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
