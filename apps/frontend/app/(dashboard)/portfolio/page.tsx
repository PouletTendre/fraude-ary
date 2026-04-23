"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import { usePortfolio } from "@/hooks/usePortfolio";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  crypto: "#F59E0B",
  stocks: "#10B981",
  real_estate: "#6366F1",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const DEMO_PORTFOLIO = {
  total_value: 124580.5,
  total_gain_loss: 15230.75,
  gain_loss_percentage: 13.93,
  by_type: [
    { type: "crypto", value: 45230.0, percentage: 36.3 },
    { type: "stocks", value: 54350.5, percentage: 43.6 },
    { type: "real_estate", value: 25000.0, percentage: 20.1 },
  ],
  history: [
    { date: "2024-01", value: 95000 },
    { date: "2024-02", value: 102000 },
    { date: "2024-03", value: 98500 },
    { date: "2024-04", value: 108000 },
    { date: "2024-05", value: 115000 },
    { date: "2024-06", value: 112000 },
    { date: "2024-07", value: 119500 },
    { date: "2024-08", value: 124580 },
  ],
};

export default function PortfolioPage() {
  const { portfolio, isLoading, error } = usePortfolio();
  const [showDemo, setShowDemo] = useState(false);

  const displayData = showDemo ? DEMO_PORTFOLIO : portfolio;

  if (isLoading && !showDemo) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if ((error || !displayData) && !showDemo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Portfolio</h1>
          <Button onClick={() => setShowDemo(true)}>Load Demo Data</Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">Failed to load portfolio data</p>
            <Button onClick={() => setShowDemo(true)}>Load Demo Data</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Portfolio</h1>
        <Button
          variant="secondary"
          onClick={() => setShowDemo(!showDemo)}
        >
          {showDemo ? "Show Real Data" : "Load Demo Data"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  ${formatCurrency(displayData.total_value)}
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
                <p className={`text-2xl font-bold mt-1 ${displayData.total_gain_loss >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {displayData.total_gain_loss >= 0 ? "+" : ""}${formatCurrency(displayData.total_gain_loss)}
                </p>
                {displayData.total_gain_loss >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600 inline mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600 inline mr-1" />
                )}
                <span className="text-sm text-gray-500">all time</span>
              </div>
              <div className={`p-3 rounded-full ${displayData.total_gain_loss >= 0 ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}>
                {displayData.total_gain_loss >= 0 ? (
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Return Rate</p>
                <p className={`text-2xl font-bold mt-1 ${displayData.gain_loss_percentage >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {displayData.gain_loss_percentage >= 0 ? "+" : ""}{displayData.gain_loss_percentage.toFixed(2)}%
                </p>
              </div>
              <div className={`p-3 rounded-full ${displayData.gain_loss_percentage >= 0 ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}>
                <Percent className={`w-6 h-6 ${displayData.gain_loss_percentage >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Allocation by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayData.by_type}
                    dataKey="value"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={2}
                    label={({ type, percentage }) => `${percentage.toFixed(1)}%`}
                  >
                    {displayData.by_type.map((entry) => (
                      <Cell key={entry.type} fill={TYPE_COLORS[entry.type] || "#9CA3AF"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${formatCurrency(value)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {displayData.by_type.map((item) => (
                <div key={item.type} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[item.type] }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{item.type.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Value by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayData.by_type} layout="vertical" margin={{ top: 10, right: 10, left: 60, bottom: 0 }}>
                  <XAxis type="number" stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `$${formatCurrency(v)}`} />
                  <YAxis type="category" dataKey="type" stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => v.replace("_", " ").charAt(0).toUpperCase() + v.replace("_", " ").slice(1)} />
                  <Tooltip formatter={(value: number) => `$${formatCurrency(value)}`} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {displayData.by_type.map((entry) => (
                      <Cell key={entry.type} fill={TYPE_COLORS[entry.type] || "#9CA3AF"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Evolution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData.history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `$${formatCurrency(v)}`} />
                <Tooltip formatter={(value: number) => `$${formatCurrency(value)}`} />
                <Legend />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
