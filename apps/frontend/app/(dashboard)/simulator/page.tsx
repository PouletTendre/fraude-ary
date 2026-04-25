"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { cn, formatNumber } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import { useSimulator } from "@/hooks/useSimulator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { Calculator, TrendingUp, DollarSign, PiggyBank, BarChart3 } from "lucide-react";
import type { SimulatorRequest } from "@/types";

export default function SimulatorPage() {
  const { formatCurrency } = useSettings();
  const { data, isLoading, error, simulate } = useSimulator();

  const [form, setForm] = useState<SimulatorRequest>({
    initial_capital: 10000,
    monthly_contribution: 500,
    annual_return_rate: 7,
    inflation_rate: 2,
    years: 20,
    dividend_yield: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    simulate(form);
  };

  const updateField = <K extends keyof SimulatorRequest>(
    key: K,
    value: SimulatorRequest[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-subtle rounded-lg">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary">Simulateur de patrimoine</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Paramètres</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Capital initial (€)"
                  type="number"
                  min={0}
                  step="any"
                  value={form.initial_capital}
                  onChange={(e) =>
                    updateField("initial_capital", parseFloat(e.target.value) || 0)
                  }
                />
                <Input
                  label="Contribution mensuelle (€)"
                  type="number"
                  min={0}
                  step="any"
                  value={form.monthly_contribution}
                  onChange={(e) =>
                    updateField("monthly_contribution", parseFloat(e.target.value) || 0)
                  }
                />

                {/* Sliders */}
                <div className="space-y-4">
                  <SliderField
                    label="Rendement annuel attendu"
                    value={form.annual_return_rate}
                    min={0}
                    max={20}
                    step={0.5}
                    unit="%"
                    onChange={(v) => updateField("annual_return_rate", v)}
                  />
                  <SliderField
                    label="Taux d'inflation"
                    value={form.inflation_rate}
                    min={0}
                    max={10}
                    step={0.25}
                    unit="%"
                    onChange={(v) => updateField("inflation_rate", v)}
                  />
                  <SliderField
                    label="Rendement dividendes"
                    value={form.dividend_yield}
                    min={0}
                    max={10}
                    step={0.25}
                    unit="%"
                    onChange={(v) => updateField("dividend_yield", v)}
                  />
                  <SliderField
                    label="Horizon"
                    value={form.years}
                    min={1}
                    max={50}
                    step={1}
                    unit=" ans"
                    onChange={(v) => updateField("years", v)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Simulation en cours..." : "Simuler"}
                </Button>

                {error && (
                  <p className="text-sm text-loss">{error}</p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {!data && !isLoading && (
              <Card>
                <CardContent className="py-16 text-center">
                  <Calculator className="w-12 h-12 mx-auto text-text-muted mb-4 opacity-50" />
                  <p className="text-text-tertiary text-lg">
                    Configurez vos paramètres et lancez la simulation
                  </p>
                </CardContent>
              </Card>
            )}

            {isLoading && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-28 rounded-xl" />
                  <Skeleton className="h-28 rounded-xl" />
                  <Skeleton className="h-28 rounded-xl" />
                  <Skeleton className="h-28 rounded-xl" />
                </div>
                <Skeleton className="h-80 rounded-xl" />
              </div>
            )}

            {data && !isLoading && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <KpiCard
                    label="Valeur finale"
                    value={formatCurrency(data.final_value, "EUR")}
                    icon={<TrendingUp className="w-5 h-5 text-gain" />}
                    variant="gain"
                  />
                  <KpiCard
                    label="Valeur réelle (inflation)"
                    value={formatCurrency(data.final_value_real, "EUR")}
                    icon={<DollarSign className="w-5 h-5 text-primary" />}
                    variant="primary"
                  />
                  <KpiCard
                    label="Total contributions"
                    value={formatCurrency(data.total_contributions, "EUR")}
                    icon={<PiggyBank className="w-5 h-5 text-secondary" />}
                    variant="secondary"
                  />
                  <KpiCard
                    label="Gains totaux"
                    value={formatCurrency(data.total_gains, "EUR")}
                    icon={<BarChart3 className="w-5 h-5 text-gain" />}
                    variant="gain"
                  />
                </div>

                {/* Area Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Évolution du portefeuille</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={data.projections}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
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
                            tickFormatter={(v) => formatCurrency(v, "EUR")}
                            width={80}
                          />
                          <Tooltip
                            formatter={(value: number, name: string) => [
                              formatCurrency(value, "EUR"),
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
                    <div className="flex justify-center gap-6 mt-4">
                      <LegendItem color="#3B82F6" label="Valeur nominale" />
                      <LegendItem color="#8B5CF6" label="Valeur réelle" />
                      <LegendItem color="#10B981" label="Contributions" dashed />
                    </div>
                  </CardContent>
                </Card>

                {/* Projections Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Projections annuelles</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-surface-sunken/50">
                            <th className="text-left px-5 py-3 font-medium text-text-tertiary">Année</th>
                            <th className="text-right px-5 py-3 font-medium text-text-tertiary">Valeur</th>
                            <th className="text-right px-5 py-3 font-medium text-text-tertiary">Valeur réelle</th>
                            <th className="text-right px-5 py-3 font-medium text-text-tertiary">Contributions</th>
                            <th className="text-right px-5 py-3 font-medium text-text-tertiary">Dividendes</th>
                            <th className="text-right px-5 py-3 font-medium text-text-tertiary">Gains</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.projections.map((row) => (
                            <tr
                              key={row.year}
                              className="border-b border-border hover:bg-surface-raised/50 transition-colors"
                            >
                              <td className="px-5 py-3 text-text-primary font-medium">{row.year}</td>
                              <td className="px-5 py-3 text-right text-text-primary font-medium">
                                {formatCurrency(row.portfolio_value, "EUR")}
                              </td>
                              <td className="px-5 py-3 text-right text-text-secondary">
                                {formatCurrency(row.portfolio_value_real, "EUR")}
                              </td>
                              <td className="px-5 py-3 text-right text-text-secondary">
                                {formatCurrency(row.total_contributions, "EUR")}
                              </td>
                              <td className="px-5 py-3 text-right text-gain">
                                {formatCurrency(row.total_dividends, "EUR")}
                              </td>
                              <td className={cn(
                                "px-5 py-3 text-right font-medium",
                                row.gains >= 0 ? "text-gain" : "text-loss"
                              )}>
                                {row.gains >= 0 ? "+" : ""}{formatCurrency(row.gains, "EUR")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-text-secondary">{label}</label>
        <span className="text-sm font-semibold text-text-primary tabular-nums">
          {formatNumber(value, step < 1 ? 2 : 0)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-surface-sunken accent-primary"
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-text-muted">{min}{unit}</span>
        <span className="text-xs text-text-muted">{max}{unit}</span>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  variant,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  variant: "gain" | "primary" | "secondary";
}) {
  const bgMap = {
    gain: "bg-gain-muted",
    primary: "bg-primary-subtle",
    secondary: "bg-surface-raised",
  };

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-tertiary">{label}</p>
            <p className="text-xl font-bold text-text-primary mt-1">{value}</p>
          </div>
          <div className={cn("p-2.5 rounded-full", bgMap[variant])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LegendItem({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-0.5 rounded-full"
        style={{
          backgroundColor: color,
          borderTop: dashed ? `2px dashed ${color}` : undefined,
        }}
      />
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}
