"use client";

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import { useDiversification } from "@/hooks/useDiversification";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { PageSection } from "@/components/ui/PageSection";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Download, Layers, Globe, Building2 } from "lucide-react";

const CHART_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#6366F1", "#14B8A6",
  "#E11D48", "#84CC16",
];

interface ChartSectionProps {
  title: string;
  icon: React.ReactNode;
  data: { label: string; value: number; percentage: number }[];
  formatCurrency: (value: number, currency?: string) => string;
}

function ChartSection({ title, icon, data, formatCurrency }: ChartSectionProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-text-tertiary">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={55}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value, "EUR"),
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xs text-text-tertiary">{data.length} categories</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {data.map((item, index) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="text-sm text-text-secondary truncate max-w-[120px]">{item.label}</span>
              <span className="text-sm font-medium text-text-primary">{item.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DiversificationPage() {
  const { data, isLoading, error, enrichAll, isEnriching } = useDiversification();
  const { formatCurrency } = useSettings();
  const { addToast } = useToast();

  const handleEnrich = () => {
    enrichAll(undefined, {
      onSuccess: (result) => {
        addToast(
          `Enriched ${result.enriched} assets${result.errors.length > 0 ? ` (${result.errors.length} errors)` : ""}`,
          result.errors.length > 0 ? "info" : "success"
        );
      },
      onError: (err: Error) => {
        addToast(`Enrichment failed: ${err.message}`, "error");
      },
    });
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </PageTransition>
    );
  }

  if (error || !data) {
    return (
      <PageTransition>
        <PageSection>
          <h1 style={{
            fontSize: "1.625rem", fontWeight: 500,
            letterSpacing: "normal", color: "var(--text-primary)", margin: 0,
          }}>
            Diversification
          </h1>
        </PageSection>
        <PageSection>
          <div className="py-12 text-center">
            <p className="text-text-tertiary">Failed to load diversification data. Please try again later.</p>
          </div>
        </PageSection>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageSection>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
          <div>
            <h1 style={{
              fontSize: "1.625rem", fontWeight: 500,
              letterSpacing: "normal", color: "var(--text-primary)", margin: 0,
            }}>
              Diversification
            </h1>
            <p style={{
              fontSize: "0.8125rem", color: "var(--text-secondary)",
              marginTop: "8px", fontFamily: "var(--font-body)",
              textTransform: "uppercase", letterSpacing: "1px",
            }}>
              Total portfolio value: {formatCurrency(data.total_value, "EUR")}
            </p>
          </div>
          <Button onClick={handleEnrich} disabled={isEnriching}>
            <Download className="w-4 h-4 mr-2" />
            {isEnriching ? "Enriching..." : "Enrich Data"}
          </Button>
        </div>
      </PageSection>

      <PageSection paddingY="24px">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          <ChartSection
            title="By Type"
            icon={<Layers className="w-5 h-5" />}
            data={data.by_type}
            formatCurrency={formatCurrency}
          />
          <ChartSection
            title="By Sector"
            icon={<Building2 className="w-5 h-5" />}
            data={data.by_sector}
            formatCurrency={formatCurrency}
          />
          <ChartSection
            title="By Geography"
            icon={<Globe className="w-5 h-5" />}
            data={data.by_country}
            formatCurrency={formatCurrency}
          />
        </div>
      </PageSection>

      <PageSection>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {[
            { title: "Type Breakdown", entries: data.by_type },
            { title: "Sector Breakdown", entries: data.by_sector },
            { title: "Geography Breakdown", entries: data.by_country },
          ].map((section) => (
            <div key={section.title}>
              <h3 style={{
                fontFamily: "var(--font-body)", fontWeight: 500,
                fontSize: "0.9375rem", color: "var(--text-primary)",
                marginBottom: "12px",
              }}>
                {section.title}
              </h3>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-sunken)" }}>
                    <th
                      className="text-left px-4 py-2 text-xs font-normal text-text-tertiary uppercase"
                      style={{ letterSpacing: "1px" }}
                    >
                      Category
                    </th>
                    <th
                      className="text-right px-4 py-2 text-xs font-normal text-text-tertiary uppercase"
                      style={{ letterSpacing: "1px" }}
                    >
                      Value
                    </th>
                    <th
                      className="text-right px-4 py-2 text-xs font-normal text-text-tertiary uppercase"
                      style={{ letterSpacing: "1px" }}
                    >
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {section.entries.length > 0 ? (
                    section.entries.map((entry) => (
                      <tr key={entry.label} className="border-b border-border hover:bg-surface-raised/50 transition-colors">
                        <td className="px-4 py-3 text-text-primary font-medium text-sm">{entry.label}</td>
                        <td className="px-4 py-3 text-right text-text-primary text-sm">{formatCurrency(entry.value, "EUR")}</td>
                        <td className="px-4 py-3 text-right text-text-secondary text-sm">{entry.percentage.toFixed(1)}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-text-tertiary text-sm">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </PageSection>
    </PageTransition>
  );
}
