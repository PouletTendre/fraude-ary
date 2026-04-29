"use client";

import { useState, useMemo } from "react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, CartesianGrid, XAxis, YAxis
} from "recharts";
import { PortfolioChart } from "@/components/PortfolioChart";
import { cn, formatNumber } from "@/lib/utils";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useAssets } from "@/hooks/useAssets";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge, getTypeVariant, getTypeLabel } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { RiskMetricsCard } from "@/components/ui/RiskMetricsCard";
import { PageSection } from "@/components/ui/PageSection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ASSET_TYPE_CONFIG, getAssetTypeChartColor, getAssetTypeLabel, ASSET_TYPE_FILTER_OPTIONS, type AssetType } from "@/lib/asset-type-config";
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, ArrowUpDown, ArrowUp, ArrowDown, Filter
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

type SortKey = "symbol" | "type" | "quantity" | "purchase_price" | "current_price" | "value" | "pnl" | "pnlPercent";
type SortDirection = "asc" | "desc";

interface AssetRow {
  id: string;
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
  const [typeFilter, setTypeFilter] = useState<string>("all");

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

  const periodMetrics = useMemo(() => {
    if (filteredHistory.length < 2) {
      return { gainLoss: 0, performance: 0 };
    }
    const firstValue = filteredHistory[0].value;
    const lastValue = filteredHistory[filteredHistory.length - 1].value;
    const gainLoss = lastValue - firstValue;
    const performance = firstValue > 0 ? (gainLoss / firstValue) * 100 : 0;
    return { gainLoss, performance };
  }, [filteredHistory]);

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
    let rows = [...assetRows];
    if (typeFilter !== "all") {
      rows = rows.filter((r) => r.type === typeFilter);
    }
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
  }, [assetRows, sortKey, sortDirection, typeFilter]);

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
      ? <ArrowUp className="w-3.5 h-3.5 text-text-secondary" /> 
      : <ArrowDown className="w-3.5 h-3.5 text-text-secondary" />;
  };

  if (isLoading) {
    return (
      <PageTransition>
        <PageSection>
          <div style={{ marginBottom: "32px" }}>
            <Skeleton style={{ height: 36, width: 200 }} />
            <Skeleton style={{ height: 18, width: 180, marginTop: "6px" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "20px" }}>
              <Skeleton style={{ height: 128 }} />
              <Skeleton style={{ height: 128 }} />
              <Skeleton style={{ height: 128 }} />
            </div>
            <Skeleton style={{ height: 200 }} />
            <Skeleton style={{ height: 384 }} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: "20px", marginTop: "24px" }}>
            <Skeleton style={{ height: 320 }} />
            <Skeleton style={{ height: 320 }} />
          </div>
          <Skeleton style={{ height: 384, marginTop: "24px" }} />
        </PageSection>
      </PageTransition>
    );
  }

  if (error || !portfolio) {
    return (
      <PageTransition>
        <PageSection>
          <div style={{ marginBottom: "32px" }}>
            <h1 className="text-h1" style={{ margin: 0 }}>
              Portfolio
            </h1>
            <p className="text-small text-text-secondary" style={{ marginTop: "6px" }}>
              Vue d&apos;ensemble
            </p>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-text-tertiary">Impossible de charger les données du portfolio. Veuillez réessayer plus tard.</p>
            </CardContent>
          </Card>
        </PageSection>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageSection>
        <div style={{ marginBottom: "32px" }}>
          <h1 className="text-h1" style={{ margin: 0 }}>
            Portfolio
          </h1>
          <p className="text-small text-text-secondary" style={{ marginTop: "6px" }}>
            Vue d&apos;ensemble
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "20px" }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-caption-lg text-text-tertiary">Total Value</p>
                    <p className="text-2xl font-tnum text-text-primary mt-1 w-590">
                      {formatCurrency(portfolio.total_value, "EUR")}
                    </p>
                  </div>
                  <div className="p-3 bg-surface-raised rounded-full">
                    <DollarSign className="w-6 h-6 text-text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-caption-lg text-text-tertiary">Total Gain/Loss</p>
                    <p className={`text-2xl font-tnum mt-1 w-590 ${periodMetrics.gainLoss >= 0 ? "text-gain" : "text-loss"}`}>
                      {periodMetrics.gainLoss >= 0 ? "+" : ""}{formatCurrency(periodMetrics.gainLoss, "EUR")}
                    </p>
                    {periodMetrics.gainLoss >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-gain inline mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-loss inline mr-1" />
                    )}
                    <span className="text-caption-lg text-text-tertiary">{selectedPeriod === "ALL" ? "all time" : PERIODS.find(p => p.value === selectedPeriod)?.label ?? selectedPeriod}</span>
                  </div>
                  <div className={`p-3 rounded-full ${periodMetrics.gainLoss >= 0 ? "bg-gain-muted" : "bg-loss-muted"}`}>
                    {periodMetrics.gainLoss >= 0 ? (
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
                    <p className="text-caption-lg text-text-tertiary">Performance</p>
                    <p className={`text-3xl font-tnum mt-1 w-590 ${periodMetrics.performance >= 0 ? "text-gain" : "text-loss"}`}>
                      {periodMetrics.performance >= 0 ? "+" : ""}{periodMetrics.performance.toFixed(2)}%
                    </p>
                    <p className={`text-caption-lg mt-1 ${periodMetrics.performance >= 0 ? "text-gain" : "text-loss"}`}>
                      {periodMetrics.performance >= 0 ? "↑ En hausse" : "↓ En baisse"}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${periodMetrics.performance >= 0 ? "bg-gain-muted" : "bg-loss-muted"}`}>
                    {periodMetrics.performance >= 0 ? (
                      <TrendingUp className="w-6 h-6 text-gain" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-loss" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk & Performance Metrics */}
          <RiskMetricsCard />

          {/* Portfolio Evolution */}
          <ErrorBoundary>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <CardTitle>Évolution du portfolio</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Activity className={cn("w-4 h-4", isLive ? "text-gain" : "text-text-muted")} />
                      <span className={cn("text-label-medium", isLive ? "text-gain" : "text-text-tertiary")}>
                        {isLive ? "LIVE" : "DELAYED"}
                      </span>
                    </div>
                    <div className="flex rounded-[var(--r-md)] overflow-hidden border border-border">
                      <button
                      onClick={() => setChartView("value")}
                      className={cn(
                        "px-3 py-1 text-caption-lg font-medium transition-colors",
                        chartView === "value"
                          ? "bg-surface-raised text-text-primary"
                          : "bg-surface-raised text-text-secondary hover:bg-surface"
                      )}
                    >
                      Valeur
                    </button>
                    <button
                      onClick={() => setChartView("performance")}
                      className={cn(
                        "px-3 py-1 text-caption-lg font-medium transition-colors",
                        chartView === "performance"
                          ? "bg-surface-raised text-text-primary"
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
                            "px-3 py-1 text-caption-lg rounded-lg transition-colors",
                            selectedPeriod === period.value
                              ? "bg-primary text-text-primary"
                              : "text-text-secondary hover:bg-surface-raised"
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
                      <p>Données historiques insuffisantes</p>
                    </div>
                  ) : chartView === "value" ? (
                    <PortfolioChart
                      data={filteredHistory.map(p => ({ time: Math.floor(new Date(p.date).getTime() / 1000), value: p.value }))}
                      type="area"
                    />
                  ) : (
                    <PortfolioChart
                      data={filteredHistory.map(p => ({ time: Math.floor(new Date(p.date).getTime() / 1000), value: p.performance ?? 0 }))}
                      type="line"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </ErrorBoundary>
        </div>

        <ErrorBoundary>
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: "20px", marginTop: "24px" }}>
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
                          <Cell key={entry.type} fill={getAssetTypeChartColor(entry.type)} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatCurrency(value, "EUR"),
                          getAssetTypeLabel(name)
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-label-medium text-text-tertiary">Total</p>
                    <p className="text-h3 font-tnum text-text-primary">
                      {formatCurrency(portfolio.total_value, "EUR")}
                    </p>
                  </div>
                </div>
                <div className="flex justify-center gap-4 mt-4 flex-wrap">
                  {portfolio.by_type.map((item) => (
                    <div key={item.type} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getAssetTypeChartColor(item.type) }} />
                      <span className="text-small text-text-secondary capitalize">{item.type.replace("_", " ")}</span>
                      <span className="text-small-medium text-text-primary">{item.percentage.toFixed(1)}%</span>
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
                        tickFormatter={(v) => getAssetTypeLabel(v)} 
                      />
                      <Tooltip formatter={(value: number) => formatCurrency(value, "EUR")} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                        {portfolio.by_type.map((entry) => (
                          <Cell key={entry.type} fill={getAssetTypeChartColor(entry.type)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </ErrorBoundary>

        {/* Detailed Assets Table */}
        <Card style={{ marginTop: "24px" }}>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle>Actifs détaillés</CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-text-muted" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  aria-label="Filtrer par type d'actif"
                  className="h-9 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm"
                >
                  {ASSET_TYPE_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-sunken/50">
                    <th 
                      className="text-left px-6 py-3 cursor-pointer hover:text-text-primary select-none text-label-medium text-text-tertiary"
                      onClick={() => handleSort("symbol")}
                    >
                      <div className="flex items-center gap-1">
                        Symbole
                        <SortIcon column="symbol" />
                      </div>
                    </th>
                    <th 
                      className="text-left px-6 py-3 cursor-pointer hover:text-text-primary select-none text-label-medium text-text-tertiary"
                      onClick={() => handleSort("type")}
                    >
                      <div className="flex items-center gap-1">
                        Type
                        <SortIcon column="type" />
                      </div>
                    </th>
                    <th 
                      className="text-right px-6 py-3 cursor-pointer hover:text-text-primary select-none text-label-medium text-text-tertiary"
                      onClick={() => handleSort("quantity")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Quantité
                        <SortIcon column="quantity" />
                      </div>
                    </th>
                    <th 
                      className="text-right px-6 py-3 cursor-pointer hover:text-text-primary select-none text-label-medium text-text-tertiary"
                      onClick={() => handleSort("purchase_price")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Prix d&apos;achat
                        <SortIcon column="purchase_price" />
                      </div>
                    </th>
                    <th 
                      className="text-right px-6 py-3 cursor-pointer hover:text-text-primary select-none text-label-medium text-text-tertiary"
                      onClick={() => handleSort("current_price")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Prix actuel
                        <SortIcon column="current_price" />
                      </div>
                    </th>
                    <th 
                      className="text-right px-6 py-3 cursor-pointer hover:text-text-primary select-none text-label-medium text-text-tertiary"
                      onClick={() => handleSort("value")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Valeur
                        <SortIcon column="value" />
                      </div>
                    </th>
                    <th 
                      className="text-right px-6 py-3 cursor-pointer hover:text-text-primary select-none text-label-medium text-text-tertiary"
                      onClick={() => handleSort("pnl")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        P&L
                        <SortIcon column="pnl" />
                      </div>
                    </th>
                    <th 
                      className="text-right px-6 py-3 cursor-pointer hover:text-text-primary select-none text-label-medium text-text-tertiary"
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
                            <div
                              className="w-2 h-8 rounded-full"
                              style={{ backgroundColor: getAssetTypeChartColor(row.type) }}
                            />
                            <span className="w-590 text-text-primary">
                              {row.symbol}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getTypeVariant(row.type) as "info" | "warning" | "success" | "accent" | "muted" | "neutral" | "subtle"}>
                            {getTypeLabel(row.type)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right text-text-primary">
                          {formatNumber(row.quantity)}
                        </td>
                        <td className="px-6 py-4 text-right text-text-secondary">
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
      </PageSection>
    </PageTransition>
  );
}
