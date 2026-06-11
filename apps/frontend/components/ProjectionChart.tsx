"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface ProjectionPoint {
  year: number;
  portfolio_value: number;
  portfolio_value_real: number;
  total_contributions: number;
  total_dividends: number;
  gains: number;
}

interface ProjectionChartProps {
  data: ProjectionPoint[];
  height?: number;
}

export function ProjectionChart({ data, height = 320 }: ProjectionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-text-tertiary">
        Aucune donnée de projection disponible
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradNominal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradContrib" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis
            dataKey="year"
            stroke="#9CA3AF"
            fontSize={12}
            tickFormatter={(v) => `Année ${v}`}
          />
          <YAxis
            stroke="#9CA3AF"
            fontSize={12}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`}
            width={60}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value.toLocaleString("fr-FR")} €`,
              name === "portfolio_value"
                ? "Valeur nominale"
                : name === "portfolio_value_real"
                ? "Valeur réelle"
                : "Contributions",
            ]}
            labelFormatter={(label) => `Année ${label}`}
          />
          <Area
            type="monotone"
            dataKey="portfolio_value"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#gradNominal)"
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="portfolio_value_real"
            stroke="#8B5CF6"
            strokeWidth={2}
            fill="url(#gradReal)"
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="total_contributions"
            stroke="#10B981"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="url(#gradContrib)"
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
