"use client";

import { useEffect, useMemo, useState } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useAssets } from "@/hooks/useAssets";
import { useSettings } from "@/hooks/useSettings";
import { useBenchmark } from "@/hooks/useBenchmark";
import { DashboardAreaChart } from "@/components/DashboardAreaChart";
import { DashboardTable } from "@/components/DashboardTable";
import { KPICard } from "@/components/ui/KPICard";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { PageSection } from "@/components/ui/PageSection";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function DashboardPage() {
  const { portfolio, analytics, isLoading: portfolioLoading } = usePortfolio();
  const { assets, isLoading: assetsLoading } = useAssets();
  const { formatCurrency } = useSettings();
  const [timeFilter, setTimeFilter] = useState("1M");
  const [lastUpdate, setLastUpdate] = useState("");
  const { benchmarkHistory, isLoading: benchmarkLoading } = useBenchmark(timeFilter);

  const isLoading = portfolioLoading || assetsLoading;

  useEffect(() => {
    if (!isLoading && (portfolio || assets)) {
      const now = new Date();
      setLastUpdate(
        now.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
  }, [isLoading, portfolio, assets]);

  // Daily change from history
  const dailyChange = useMemo(() => {
    if (!portfolio?.history || portfolio.history.length < 2) return null;
    const history = [...portfolio.history].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    const change = latest.value - previous.value;
    const percent = previous.value !== 0 ? (change / previous.value) * 100 : 0;
    return { change, percent };
  }, [portfolio?.history]);

  // Enriched assets for table
  const enrichedAssets = useMemo(() => {
    if (!assets || assets.length === 0) return [];
    return [...assets]
      .map((asset) => ({
        ...asset,
        pnlPercent:
          ((asset.current_price - asset.purchase_price) / asset.purchase_price) *
          100,
        value: asset.current_price * asset.quantity,
        allocation: portfolio?.total_value
          ? ((asset.current_price * asset.quantity) / portfolio.total_value) *
            100
          : 0,
        dailyChange24h: "0.00%",
      }))
      .sort((a, b) => b.value - a.value);
  }, [assets, portfolio?.total_value]);

  // Allocation by type
  const typeAllocation = useMemo(() => {
    if (!portfolio?.by_type) return [];
    return portfolio.by_type.map((t) => ({
      type: t.type,
      value: t.value,
      percentage: t.percentage,
      color:
        t.type === "stocks"
          ? "var(--primary)"
          : t.type === "crypto"
          ? "#f7931a"
          : t.type === "real_estate"
          ? "var(--gain)"
          : "var(--text-tertiary)",
    }));
  }, [portfolio?.by_type]);

  // Portfolio history for chart
  const portfolioHistory = useMemo(() => {
    if (!portfolio?.history) return [];
    return [...portfolio.history]
      .map((h) => ({
        date: h.date,
        value: h.value,
      }))
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
  }, [portfolio?.history]);

  if (isLoading) {
    return (
      <PageTransition>
        <PageSection>
          <div style={{ marginBottom: "32px" }}>
            <Skeleton style={{ height: "36px", width: "200px" }} />
            <Skeleton
              style={{ height: "16px", width: "300px", marginTop: "6px" }}
            />
          </div>
          <Skeleton style={{ height: "380px", borderRadius: "var(--r-panel)" }} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginTop: "24px",
            }}
          >
            <Skeleton style={{ height: "320px" }} />
            <Skeleton style={{ height: "320px" }} />
          </div>
        </PageSection>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageSection maxWidth="1400px">
        {/* Page header */}
        <div style={{ marginBottom: "28px" }}>
          <h1
            className="text-h1"
            style={{ margin: "0 0 4px" }}
          >
            Dashboard
          </h1>
          <p
            className="text-small text-text-secondary"
            style={{ margin: 0 }}
          >
            {lastUpdate ? `Mis à jour le ${lastUpdate}` : "Chargement..."}
          </p>
        </div>

        {/* Area chart */}
        <ErrorBoundary>
          <DashboardAreaChart
            portfolioHistory={portfolioHistory}
            benchmarkHistory={benchmarkHistory}
            period={timeFilter}
            totalGainLoss={portfolio?.total_gain_loss ?? 0}
            gainLossPercent={portfolio?.gain_loss_percentage ?? 0}
            onPeriodChange={setTimeFilter}
          />
        </ErrorBoundary>

        {/* KPI row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            marginTop: "20px",
          }}
        >
          <KPICard
            label="Valeur totale"
            value={
              portfolio
                ? formatCurrency(portfolio.total_value, "EUR")
                : "—"
            }
            delta={
              portfolio
                ? `${portfolio.gain_loss_percentage >= 0 ? "+" : ""}${portfolio.gain_loss_percentage.toFixed(2)}% global`
                : undefined
            }
            isPositive={
              portfolio ? portfolio.gain_loss_percentage >= 0 : null
            }
          />
          <KPICard
            label="P&L journalier"
            value={
              dailyChange
                ? `${dailyChange.change >= 0 ? "+" : ""}${formatCurrency(dailyChange.change, "EUR")}`
                : "—"
            }
            delta={
              dailyChange
                ? `${dailyChange.percent >= 0 ? "+" : ""}${dailyChange.percent.toFixed(2)}%`
                : undefined
            }
            isPositive={dailyChange ? dailyChange.change >= 0 : null}
          />
          <KPICard
            label="Volatilité annualisée"
            value={
              analytics?.volatility_annual != null
                ? `${(analytics.volatility_annual * 100).toFixed(1)}%`
                : "—"
            }
            delta={
              analytics?.volatility_annual != null
                ? analytics.volatility_annual < 0.15
                  ? "Risque faible"
                  : analytics.volatility_annual < 0.25
                  ? "Risque modéré"
                  : "Risque élevé"
                : undefined
            }
            isPositive={
              analytics?.volatility_annual != null
                ? analytics.volatility_annual < 0.2
                : null
            }
          />
        </div>

        {/* Two-column layout: Table + Allocation */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr",
            gap: "20px",
            marginTop: "20px",
            alignItems: "start",
          }}
          className="max-lg:grid-cols-1"
        >
          {/* Assets table */}
          <ErrorBoundary>
            <DashboardTable
              assets={enrichedAssets}
              formatCurrency={formatCurrency}
            />
          </ErrorBoundary>

          {/* Allocation panel */}
          <ErrorBoundary>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-panel)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 590,
                    color: "var(--text-primary)",
                  }}
                >
                  Allocation
                </span>
              </div>

              <div style={{ padding: "20px" }}>
                {typeAllocation.length > 0 ? (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                  >
                    {typeAllocation.map((item) => (
                      <div key={item.type}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 510,
                              color: "var(--text-primary)",
                              textTransform: "capitalize",
                            }}
                          >
                            {item.type === "stocks"
                              ? "Actions"
                              : item.type === "crypto"
                              ? "Crypto"
                              : item.type === "real_estate"
                              ? "Immobilier"
                              : item.type}
                          </span>
                          <span
                            className="font-mono font-tnum"
                            style={{
                              fontSize: "13px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: "6px",
                            background: "var(--border)",
                            borderRadius: "9999px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              borderRadius: "9999px",
                              background: item.color,
                              width: `${item.percentage}%`,
                              transition: "width 400ms ease-out",
                            }}
                          />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: "4px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "11px",
                              color: "var(--text-tertiary)",
                            }}
                          >
                            {enrichedAssets.filter(
                              (a) =>
                                a.type ===
                                (item.type === "real_estate"
                                  ? "real_estate"
                                  : item.type)
                            ).length}{" "}
                            actif(s)
                          </span>
                          <span
                            className="font-mono font-tnum"
                            style={{
                              fontSize: "11px",
                              color: "var(--text-tertiary)",
                            }}
                          >
                            {formatCurrency(item.value, "EUR")}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Total bar */}
                    <div
                      style={{
                        paddingTop: "16px",
                        borderTop: "1px solid var(--border-subtle)",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 590,
                          color: "var(--text-primary)",
                        }}
                      >
                        Total
                      </span>
                      <span
                        className="font-mono font-tnum"
                        style={{
                          fontSize: "13px",
                          fontWeight: 590,
                          color: "var(--text-primary)",
                        }}
                      >
                        {formatCurrency(portfolio?.total_value ?? 0, "EUR")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "32px 0",
                      textAlign: "center",
                      color: "var(--text-tertiary)",
                      fontSize: "13px",
                    }}
                  >
                    Aucune donnée d&apos;allocation
                  </div>
                )}
              </div>
            </div>
          </ErrorBoundary>
        </div>
      </PageSection>
    </PageTransition>
  );
}
