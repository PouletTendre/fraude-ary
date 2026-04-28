"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTechnical } from "@/hooks/useTechnical";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { PageSection } from "@/components/ui/PageSection";
import { NewsCard } from "@/components/ui/NewsCard";
import { ValuationCard } from "@/components/ui/ValuationCard";
import { SymbolSearch } from "@/components/SymbolSearch";

function rsiBadge(rsi: number | null): { label: string; variant: "success" | "neutral" | "subtle" } {
  if (rsi === null) return { label: "--", variant: "neutral" };
  if (rsi > 70) return { label: "Overbought", variant: "subtle" };
  if (rsi < 30) return { label: "Oversold", variant: "success" };
  return { label: "Neutral", variant: "neutral" };
}

function RsiGauge({ value }: { value: number | null }) {
  const pct = value !== null ? Math.max(0, Math.min(100, value)) : 0;
  const color =
    value === null ? "var(--text-muted)" :
    value > 70 ? "var(--loss)" :
    value < 30 ? "var(--gain)" :
    "var(--warning)";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-small text-text-secondary">RSI (14)</span>
        <span className="text-h3 font-tnum" style={{ color }}>
          {value !== null ? value.toFixed(1) : "--"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-sunken overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-text-muted">
        <span>0</span>
        <span className={value !== null && value < 30 ? "text-gain w-590" : ""}>30</span>
        <span className={value !== null && value >= 30 && value <= 70 ? "text-warning w-590" : ""}>50</span>
        <span className={value !== null && value > 70 ? "text-loss w-590" : ""}>70</span>
        <span>100</span>
      </div>
    </div>
  );
}

function IndicatorCard({
  title,
  children,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  badge?: { label: string; variant: "success" | "neutral" | "subtle" };
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function fmtVal(val: number | null, decimals: number = 2): string {
  if (val === null || val === undefined) return "--";
  return val.toFixed(decimals);
}

function macdBadge(histogram: number | null): { label: string; variant: "success" | "neutral" | "subtle" } {
  if (histogram === null) return { label: "--", variant: "neutral" };
  if (histogram > 0) return { label: "Bullish", variant: "success" };
  if (histogram < 0) return { label: "Bearish", variant: "subtle" };
  return { label: "Neutral", variant: "neutral" };
}

export default function AnalysisPage() {
  const [symbol, setSymbol] = useState("");
  const { data, isLoading, error } = useTechnical(symbol);

  const indicators = data;

  return (
    <PageTransition>
      <PageSection>
        <h1 className="text-h1" style={{ margin: 0 }}>
          Analyse Technique
        </h1>
        <p className="text-small text-text-secondary" style={{ marginTop: "8px" }}>
          Analyse technique et fondamentale
        </p>
      </PageSection>

      <PageSection>
        <div className="space-y-6">
          <SymbolSearch
            value={symbol}
            onChange={setSymbol}
          />

          {!symbol ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <p className="text-text-tertiary">Recherchez un symbole à analyser</p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-text-tertiary">
                  Échec du chargement des données techniques pour {symbol}. Veuillez vérifier le symbole.
                </p>
              </CardContent>
            </Card>
          ) : indicators ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]">
                {/* RSI */}
                <IndicatorCard
                  title="RSI"
                  badge={rsiBadge(indicators.rsi)}
                >
                  <RsiGauge value={indicators.rsi} />
                </IndicatorCard>

                {/* MACD */}
                <IndicatorCard
                  title="MACD"
                  badge={macdBadge(indicators.macd?.histogram ?? null)}
                >
                  {indicators.macd ? (
                    <div className="space-y-2 font-tnum">
                      <div className="flex justify-between">
                        <span className="text-small text-text-muted">MACD Line</span>
                        <span className="text-small text-text-primary">{fmtVal(indicators.macd.macd_line, 4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-small text-text-muted">Signal</span>
                        <span className="text-small text-text-primary">{fmtVal(indicators.macd.signal_line, 4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-small text-text-muted">Histogram</span>
                        <span className={cn("text-small-medium", indicators.macd.histogram >= 0 ? "text-gain" : "text-loss")}>
                          {fmtVal(indicators.macd.histogram, 4)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-small text-text-tertiary">No data</p>
                  )}
                </IndicatorCard>

                {/* Bollinger Bands */}
                <IndicatorCard title="Bollinger Bands">
                  {indicators.bollinger ? (
                    <div className="space-y-2 font-tnum">
                      <div className="flex justify-between">
                        <span className="text-small text-text-muted">Upper</span>
                        <span className="text-small text-text-primary">{fmtVal(indicators.bollinger.upper)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-small text-text-muted">Middle</span>
                        <span className="text-small text-text-primary">{fmtVal(indicators.bollinger.middle)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-small text-text-muted">Lower</span>
                        <span className="text-small text-text-primary">{fmtVal(indicators.bollinger.lower)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-small text-text-tertiary">No data</p>
                  )}
                </IndicatorCard>

                {/* Moving Averages */}
                <IndicatorCard title="Moving Averages">
                  <div className="space-y-2 font-tnum">
                    <div className="flex justify-between">
                      <span className="text-small text-text-muted">SMA 20</span>
                      <span className="text-small text-text-primary">{fmtVal(indicators.sma_20)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-small text-text-muted">SMA 50</span>
                      <span className="text-small text-text-primary">{fmtVal(indicators.sma_50)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-small text-text-muted">SMA 200</span>
                      <span className="text-small text-text-primary">{fmtVal(indicators.sma_200)}</span>
                    </div>
                    <div className="border-t border-border pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-small text-text-muted">EMA 12</span>
                        <span className="text-small text-text-primary">{fmtVal(indicators.ema_12)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-small text-text-muted">EMA 26</span>
                        <span className="text-small text-text-primary">{fmtVal(indicators.ema_26)}</span>
                      </div>
                    </div>
                  </div>
                </IndicatorCard>

                {/* ATR */}
                <IndicatorCard title="ATR">
                  <div className="flex items-center justify-center py-4">
                    <span className="text-h3 font-tnum text-text-primary">
                      {fmtVal(indicators.atr)}
                    </span>
                  </div>
                </IndicatorCard>

                {/* OBV */}
                <IndicatorCard title="OBV">
                  <div className="flex items-center justify-center py-4">
                    <span className="text-h3 font-tnum text-text-primary">
                      {indicators.obv !== null ? formatObv(indicators.obv) : "--"}
                    </span>
                  </div>
                </IndicatorCard>

                {/* Stochastic */}
                <IndicatorCard title="Stochastic">
                  {indicators.stochastic ? (
                    <div className="space-y-2 font-tnum">
                      <div className="flex justify-between">
                        <span className="text-small text-text-muted">%K</span>
                        <span className="text-small text-text-primary">{fmtVal(indicators.stochastic.stoch_k)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-small text-text-muted">%D</span>
                        <span className="text-small text-text-primary">{fmtVal(indicators.stochastic.stoch_d)}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge
                          variant={indicators.stochastic.stoch_k > 80 ? "subtle" : indicators.stochastic.stoch_k < 20 ? "success" : "neutral"}
                        >
                          %K: {indicators.stochastic.stoch_k > 80 ? "Overbought" : indicators.stochastic.stoch_k < 20 ? "Oversold" : "Neutral"}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-small text-text-tertiary">No data</p>
                  )}
                </IndicatorCard>

                {/* MFI */}
                <IndicatorCard
                  title="MFI"
                    badge={{
                      label: indicators.mfi !== null ? (indicators.mfi > 80 ? "Overbought" : indicators.mfi < 20 ? "Oversold" : "Neutral") : "--",
                      variant: indicators.mfi !== null ? (indicators.mfi > 80 ? "subtle" : indicators.mfi < 20 ? "success" : "neutral") : "neutral",
                    }}
                >
                  <div className="flex items-center justify-center py-4">
                    <span className="text-h3 font-tnum text-text-primary">
                      {fmtVal(indicators.mfi)}
                    </span>
                  </div>
                </IndicatorCard>

                {/* Symbol Info */}
                <IndicatorCard title="Symbol Info">
                  <div className="py-4 text-center">
                    <span className="text-h3 text-text-primary w-590">
                      {indicators.symbol}
                    </span>
                  </div>
                </IndicatorCard>
              </div>

              <ValuationCard symbol={symbol} />

              <NewsCard symbol={symbol} />
            </>
          ) : null}
        </div>
      </PageSection>
    </PageTransition>
  );
}

function formatObv(value: number): string {
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(0);
}
