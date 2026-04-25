"use client";

import { useState, useMemo } from "react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar
} from "recharts";
import { cn, formatNumber } from "@/lib/utils";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useAssets } from "@/hooks/useAssets";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
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

type SortKey = "symbol" | "type" | "quantity" | "purchase_price" | "current_price" | "value" | "pnl" | "pnlPercent";
type SortDirection = "asc" | "desc";

interface AssetRow {
  id: number;
  symbol: string;
  type: string;
  quantity: number;
  purchase_price: number;
  purchase_price_eur?: number;
  current_price: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  currency: string;
}

export default function PortfolioPage() {
  const { portfolio, isLoading: portfolioLoading, error } = usePortfolio();
  const { assets, isLoading: assetsLoading } = useAssets();
  const { formatCurrency } = useSettings();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("1M");
  const [isLive, setIsLive] = useState(true);
  const [chartView, setChartView] = useState<"value" | "performance">("value");
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
    const mapPoint = (point: typeof portfolio.history[0]) => ({
      ...point,
      performance: point.performance ?? 0,
    });
    if (days === Infinity) return portfolio.history.map(mapPoint);
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return portfolio.history
      .filter((point) => new Date(point.date) >= cutoff)
      .map(mapPoint);
  }, [portfolio?.history, selectedPeriod]);

  const assetRows: AssetRow[] = useMemo(() => {
    if (!assets) return [];
    return assets.map(asset => ({
      id: asset.id,
      symbol: asset.symbol,
      type: asset.type,
      quantity: asset.quantity,
      purchase_price: asset.purchase_price,
      purchase_price_eur: asset.purchase_price_eur,
      current_price: asset.current_price,
      value: asset.current_price * asset.quantity,
      pnl: (asset.current_price - asset.purchase_price) * asset.quantity,
      pnlPercent: ((asset.current_price - asset.purchase_price) / asset.purchase_price) * 100,
      currency: asset.currency,
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
    if (sortKey !== column) return <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="w-3.5 h-3.5 text-primary" /> 
      : <ArrowDown className="w-3.5 h-3.5 text-primary" />;
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </PageTransition>
    );
  }

  if (error || !portfolio) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-text-primary">Portfolio</h1>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-text-tertiary">Failed to load portfolio data. Please try again later.</p>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Portfolio</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-tertiary">Total Value</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {formatCurrency(portfolio.total_value, "EUR")}
                </p>
              </div>
              <div className="p-3 bg-primary-subtle rounded-full">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-tertiary">Total Gain/Loss</p>
                <p className={`text-2xl font-bold mt-1 ${portfolio.total_gain_loss >= 0 ? "text-gain" : "text-loss"}`}>
                  {portfolio.total_gain_loss >= 0 ? "+" : ""}{formatCurrency(portfolio.total_gain_loss, "EUR")}
                </p>
                {portfolio.total_gain_loss >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-gain inline mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-loss inline mr-1" />
                )}
                <span className="text-sm text-text-tertiary">all time</span>
              </div>
              <div className={`p-3 rounded-full ${portfolio.total_gain_loss >= 0 ? "bg-gain-muted" : "bg-loss-muted"}`}>
                {portfolio.total_gain_loss >= 0 ? (
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
                <p className={`text-3xl font-bold mt-1 ${portfolio.gain_loss_percentage >= 0 ? "text-gain" : "text-loss"}`}>
                  {portfolio.gain_loss_percentage >= 0 ? "+" : ""}{portfolio.gain_loss_percentage.toFixed(2)}%
                </p>
                <p className={`text-sm mt-1 ${portfolio.gain_loss_percentage >= 0 ? "text-gain" : "text-loss"}`}>
                  {portfolio.gain_loss_percentage >= 0 ? "↑ En hausse" : "↓ En baisse"}
                </p>
              </div>
              <div className={`p-3 rounded-full ${portfolio.gain_loss_percentage >= 0 ? "bg-gain-muted" : "bg-loss-muted"}`}>
                {portfolio.gain_loss_percentage >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-gain" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-loss" />
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
                      formatCurrency(value, "EUR"),
                      TYPE_LABELS[name] || name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xs text-text-tertiary">Total</p>
                <p className="text-lg font-bold text-text-primary">
                  {formatCurrency(portfolio.total_value, "EUR")}
                </p>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
              {portfolio.by_type.map((item) => (
                <div key={item.type} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[item.type] }} />
                  <span className="text-sm text-text-secondary text-text-muted capitalize">{item.type.replace("_", " ")}</span>
                  <span className="text-sm font-medium text-text-primary">{item.percentage.toFixed(1)}%</span>
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
                  <XAxis type="number" stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => formatCurrency(v, "EUR")} />
                  <YAxis 
                    type="category" 
                    dataKey="type" 
                    stroke="#9CA3AF" 
                    fontSize={12} 
                    tickFormatter={(v) => TYPE_LABELS[v] || v.replace("_", " ")} 
                  />
                  <Tooltip formatter={(value: number) => formatCurrency(value, "EUR")} />
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
                <Activity className={cn("w-4 h-4", isLive ? "text-gain" : "text-text-muted")} />
                <span className={cn("text-xs font-medium", isLive ? "text-gain" : "text-text-tertiary")}>
                  {isLive ? "LIVE" : "DELAYED"}
                </span>
              </div>
              <div className="flex rounded-[var(--r-md)] overflow-hidden border border-border">
                <button
                  onClick={() => setChartView("value")}
                  className={cn(
                    "px-3 py-1 text-sm font-medium transition-colors",
                    chartView === "value"
                      ? "bg-primary text-white"
                      : "bg-surface-raised text-text-secondary hover:bg-surface"
                  )}
                >
                  Valeur
                </button>
                <button
                  onClick={() => setChartView("performance")}
                  className={cn(
                    "px-3 py-1 text-sm font-medium transition-colors",
                    chartView === "performance"
                      ? "bg-primary text-white"
                      : "bg-surface-raised text-text-secondary hover:bg-surface"
                  )}
                >
                  Performance
                </button>
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
                        : "text-text-secondary text-text-muted hover:bg-surface-raised"
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
            {filteredHistory.length < 2 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-tertiary gap-2">
                <Activity className="w-8 h-8 opacity-50" />
                <p>Not enough history data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartView === "value" ? (
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
                      tickFormatter={(v) => formatCurrency(v, "EUR")}
                      width={80}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value, "EUR"), "Valeur"]}
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
                ) : (
                  <LineChart data={filteredHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                      tickFormatter={(v: number) => `${v.toFixed(2)}%`}
                      width={80}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(2)}%`, "Performance"]}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="performance"
                      stroke="#6366F1"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
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
                <tr className="border-b border-border bg-surface-sunken/50">
                  <th 
                    className="text-left px-6 py-3 font-medium text-text-tertiary cursor-pointer hover:text-text-secondary hover:text-text-primary select-none"
                    onClick={() => handleSort("symbol")}
                  >
                    <div className="flex items-center gap-1">
                      Symbole
                      <SortIcon column="symbol" />
                    </div>
                  </th>
                  <th 
                    className="text-left px-6 py-3 font-medium text-text-tertiary cursor-pointer hover:text-text-secondary hover:text-text-primary select-none"
                    onClick={() => handleSort("type")}
                  >
                    <div className="flex items-center gap-1">
                      Type
                      <SortIcon column="type" />
                    </div>
                  </th>
                  <th 
                    className="text-right px-6 py-3 font-medium text-text-tertiary cursor-pointer hover:text-text-secondary hover:text-text-primary select-none"
                    onClick={() => handleSort("quantity")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Quantité
                      <SortIcon column="quantity" />
                    </div>
                  </th>
                  <th 
                    className="text-right px-6 py-3 font-medium text-text-tertiary cursor-pointer hover:text-text-secondary hover:text-text-primary select-none"
                    onClick={() => handleSort("purchase_price")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Prix d&apos;achat
                      <SortIcon column="purchase_price" />
                    </div>
                  </th>
                  <th 
                    className="text-right px-6 py-3 font-medium text-text-tertiary cursor-pointer hover:text-text-secondary hover:text-text-primary select-none"
                    onClick={() => handleSort("current_price")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Prix actuel
                      <SortIcon column="current_price" />
                    </div>
                  </th>
                  <th 
                    className="text-right px-6 py-3 font-medium text-text-tertiary cursor-pointer hover:text-text-secondary hover:text-text-primary select-none"
                    onClick={() => handleSort("value")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Valeur
                      <SortIcon column="value" />
                    </div>
                  </th>
                  <th 
                    className="text-right px-6 py-3 font-medium text-text-tertiary cursor-pointer hover:text-text-secondary hover:text-text-primary select-none"
                    onClick={() => handleSort("pnl")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      P&L
                      <SortIcon column="pnl" />
                    </div>
                  </th>
                  <th 
                    className="text-right px-6 py-3 font-medium text-text-tertiary cursor-pointer hover:text-text-secondary hover:text-text-primary select-none"
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
                      className="border-b border-border hover:bg-surface-raised/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-8 rounded-full",
                            row.type === "crypto" && "bg-secondary",
                            row.type === "stocks" && "bg-gain",
                            row.type === "real_estate" && "bg-primary"
                          )} />
                          <span className="font-semibold text-text-primary uppercase">
                            {row.symbol}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-text-secondary bg-surface-raised text-text-secondary capitalize">
                          {row.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-text-primary">
                        {formatNumber(row.quantity)}
                      </td>
                      <td className="px-6 py-4 text-right text-text-secondary text-text-muted">
                        {formatCurrency(row.purchase_price, row.currency)}
                        {row.purchase_price_eur !== undefined && row.currency !== "EUR" && (
                          <div className="text-[11px] text-text-tertiary mt-0.5">
                            ≈ {formatCurrency(row.purchase_price_eur, "EUR")}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-text-primary font-medium">
                        {formatCurrency(row.current_price, row.currency)}
                      </td>
                      <td className="px-6 py-4 text-right text-text-primary font-medium">
                        {formatCurrency(row.value, row.currency)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          "font-medium",
                          row.pnl >= 0 ? "text-gain" : "text-loss"
                        )}>
                          {row.pnl >= 0 ? "+" : ""}{formatCurrency(row.pnl, row.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          "inline-flex items-center gap-1 font-medium",
                          row.pnlPercent >= 0 ? "text-gain" : "text-loss"
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
                    <td colSpan={8} className="px-6 py-12 text-center text-text-tertiary">
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
    </PageTransition>
  );
}
