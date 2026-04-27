"use client";

import { useEffect, useMemo, useState } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useAssets } from "@/hooks/useAssets";
import { useSettings } from "@/hooks/useSettings";
import { KPICard } from "@/components/ui/KPICard";
import { TimeFilterChips } from "@/components/ui/TimeFilterChips";
import { Badge } from "@/components/ui/Badge";
import { AssetAvatar } from "@/components/ui/AssetAvatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { MarketWeatherWidget } from "@/components/MarketWeatherWidget";
import { RecentTransactionsWidget } from "@/components/RecentTransactionsWidget";
import { GoalsWidget } from "@/components/GoalsWidget";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function formatNumber(value: number, currency?: string) {
  const opts: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };
  if (currency) {
    opts.style = "currency";
    opts.currency = currency;
  }
  return new Intl.NumberFormat("fr-FR", opts).format(value);
}

export default function DashboardPage() {
  const { portfolio, analytics, isLoading: portfolioLoading } = usePortfolio();
  const { assets, isLoading: assetsLoading } = useAssets();
  const { formatCurrency } = useSettings();
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState("1M");

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
      }))
      .sort((a, b) => b.value - a.value);
  }, [assets, portfolio?.total_value]);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex flex-col gap-[32px]">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton style={{ height: "36px", width: "200px" }} />
              <Skeleton style={{ height: "16px", width: "300px" }} />
            </div>
            <Skeleton style={{ height: "36px", width: "120px" }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[12px]">
            <Skeleton style={{ height: "110px", borderRadius: "14px" }} />
            <Skeleton style={{ height: "110px", borderRadius: "14px" }} />
            <Skeleton style={{ height: "110px", borderRadius: "14px" }} />
            <Skeleton style={{ height: "110px", borderRadius: "14px" }} />
          </div>
          <Skeleton style={{ height: "300px", borderRadius: "14px" }} />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-[32px]">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "var(--text-primary)",
              }}
            >
              Dashboard
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                marginTop: "4px",
              }}
            >
              {lastUpdate
                ? `Mis à jour le ${lastUpdate} · Bourse ouverte`
                : "Chargement..."}
            </p>
          </div>
          <div className="flex items-center gap-[8px]">
            <button
              className="inline-flex items-center gap-[6px] text-[14px] font-medium font-sans cursor-pointer transition-all duration-150 ease-out whitespace-nowrap"
              style={{
                background: "var(--surface-raised)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-md)",
                padding: "7px 12px",
                fontSize: "13px",
              }}
            >
              Exporter CSV
            </button>
            <Link
              href="/assets"
              className="inline-flex items-center gap-[6px] text-[14px] font-medium font-sans cursor-pointer transition-all duration-150 ease-out whitespace-nowrap no-underline"
              style={{
                background: "var(--primary)",
                color: "var(--text-primary)",
                borderRadius: "var(--r-md)",
                padding: "7px 12px",
                fontSize: "13px",
              }}
            >
              + Ajouter actif
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[12px]">
          <KPICard
            label="Valeur totale"
            value={portfolio ? formatCurrency(portfolio.total_value, "EUR") : "—"}
            delta={
              portfolio
                ? `${portfolio.gain_loss_percentage >= 0 ? "+" : ""}${portfolio.gain_loss_percentage.toFixed(2)}% ce mois`
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
            value={analytics?.volatility_annual != null ? `${(analytics.volatility_annual * 100).toFixed(1)}%` : "—"}
            delta={analytics?.volatility_annual != null ? (analytics.volatility_annual < 0.15 ? "faible" : analytics.volatility_annual < 0.25 ? "modérée" : "élevée") : undefined}
            isPositive={analytics?.volatility_annual != null ? analytics.volatility_annual < 0.2 : null}
          />
          <KPICard
            label="Ratio de Sharpe"
            value={analytics?.sharpe_ratio != null ? analytics.sharpe_ratio.toFixed(2) : "—"}
            delta={analytics?.sharpe_ratio != null ? (analytics.sharpe_ratio > 1 ? "bon" : analytics.sharpe_ratio > 0 ? "moyen" : "négatif") : undefined}
            isPositive={analytics?.sharpe_ratio != null ? analytics.sharpe_ratio > 0 : null}
          />
        </div>

        {/* Time filter */}
        <TimeFilterChips value={timeFilter} onChange={setTimeFilter} />

        {/* Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
          <MarketWeatherWidget />
          <RecentTransactionsWidget />
          <GoalsWidget />
        </div>

        {/* Asset Table */}
        <div
          className="overflow-hidden"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
          }}
        >
          {/* Table header row */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: "16px 20px 12px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Mes positions
            </span>
            <Link
              href="/portfolio"
              className="flex items-center gap-1 no-underline"
              style={{
                fontSize: "0.875rem",
                color: "var(--primary)",
              }}
            >
              Voir détails <ArrowRight style={{ width: "16px", height: "16px" }} />
            </Link>
          </div>

          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Actif", "Prix", "24h", "Valeur", "Allocation", "Statut"].map(
                  (h, i) => (
                    <th
                      key={h}
                      style={{
                        background: "var(--surface-sunken)",
                        color: "var(--text-tertiary)",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        padding: "10px 16px",
                        textAlign: i > 0 ? "right" : "left",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {enrichedAssets.length > 0 ? (
                enrichedAssets.slice(0, 6).map((asset) => {
                  const avatarType =
                    asset.type === "crypto"
                      ? "crypto"
                      : asset.type === "stocks"
                        ? "equity"
                        : "other";
                  const isGain = asset.pnlPercent >= 0;
                  return (
                    <tr
                      key={asset.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        transition: "background 150ms ease-out",
                      }}
                      className="hover:bg-surface-raised"
                    >
                      <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                        <div className="flex items-center gap-[10px]">
                          <AssetAvatar
                            symbol={asset.symbol}
                            type={avatarType}
                          />
                          <div>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: 500,
                                color: "var(--text-primary)",
                              }}
                            >
                              {asset.symbol.toUpperCase()}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "var(--text-tertiary)",
                                marginTop: "1px",
                              }}
                            >
                              {asset.type.replace("_", " ")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        className="font-mono font-tnum"
                        style={{
                          padding: "14px 16px",
                          textAlign: "right",
                          fontSize: "13px",
                          color: "var(--text-primary)",
                        }}
                      >
                        {formatCurrency(asset.current_price, asset.currency)}
                      </td>
                      <td
                        className={cn(
                          "font-mono font-tnum",
                          isGain ? "text-gain" : "text-loss"
                        )}
                        style={{
                          padding: "14px 16px",
                          textAlign: "right",
                          fontSize: "13px",
                        }}
                      >
                        {isGain ? "+" : ""}
                        {asset.pnlPercent.toFixed(2)}%
                      </td>
                      <td
                        className="font-mono font-tnum"
                        style={{
                          padding: "14px 16px",
                          textAlign: "right",
                          fontSize: "13px",
                          color: "var(--text-primary)",
                        }}
                      >
                        {formatCurrency(asset.value, asset.currency)}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div className="flex items-center gap-[8px] justify-end">
                          <div
                            style={{
                              width: "80px",
                              height: "6px",
                              background: "var(--border)",
                              borderRadius: "9999px",
                              overflow: "hidden",
                              flexShrink: 0,
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                borderRadius: "9999px",
                                background:
                                  "linear-gradient(90deg, var(--primary), var(--secondary))",
                                width: `${Math.min(asset.allocation, 100)}%`,
                              }}
                            />
                          </div>
                          <span
                            className="font-mono font-tnum"
                            style={{
                              fontSize: "11px",
                              color: "var(--text-tertiary)",
                              minWidth: "28px",
                              textAlign: "right",
                            }}
                          >
                            {asset.allocation.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <Badge
                          variant={
                            isGain
                              ? asset.allocation > 20
                                ? "info"
                                : "gain"
                              : asset.pnlPercent < -5
                                ? "warning"
                                : "loss"
                          }
                        >
                          {isGain
                            ? asset.allocation > 20
                              ? "Long"
                              : "▲ +" + asset.pnlPercent.toFixed(2) + "%"
                            : asset.pnlPercent < -5
                              ? "⚠ Volatil"
                              : "▼ " + asset.pnlPercent.toFixed(2) + "%"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "32px",
                      textAlign: "center",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    Aucun actif. Ajoutez votre premier actif pour commencer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageTransition>
  );
}
