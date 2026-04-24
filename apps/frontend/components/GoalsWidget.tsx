"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useSettings } from "@/hooks/useSettings";
import { Target, TrendingUp, Wallet, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

interface Goal {
  id: string;
  title: string;
  icon: React.ReactNode;
  current: number;
  target: number;
  color: string;
  bgColor: string;
}

export function GoalsWidget() {
  const { portfolio, isLoading } = usePortfolio();
  const { formatCurrency } = useSettings();

  const goals: Goal[] = useMemo(() => {
    const totalValue = portfolio?.total_value || 0;
    const gainLoss = portfolio?.total_gain_loss || 0;

    return [
      {
        id: "portfolio-growth",
        title: "Portfolio Growth",
        icon: <TrendingUp className="w-4 h-4" />,
        current: totalValue,
        target: Math.max(totalValue * 1.5, 10000),
        color: "bg-blue-600",
        bgColor: "bg-primary-subtle",
      },
      {
        id: "profit-target",
        title: "Profit Target",
        icon: <Wallet className="w-4 h-4" />,
        current: Math.max(0, gainLoss),
        target: Math.max(Math.abs(gainLoss) * 2, 5000),
        color: "bg-green-600",
        bgColor: "bg-gain-muted",
      },
      {
        id: "diversification",
        title: "Diversification",
        icon: <Shield className="w-4 h-4" />,
        current: portfolio?.by_type?.length || 0,
        target: 5,
        color: "bg-amber-600",
        bgColor: "bg-amber-100 dark:bg-amber-900",
      },
    ];
  }, [portfolio]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Objectives
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {goals.map((goal) => {
            const percentage = Math.min(100, Math.round((goal.current / goal.target) * 100));
            const isCurrency = goal.id !== "diversification";

            return (
              <div key={goal.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary",
                        goal.bgColor
                      )}
                    >
                      {goal.icon}
                    </div>
                    <span className="text-sm font-medium text-text-secondary">
                      {goal.title}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-text-primary">
                      {isCurrency ? formatCurrency(goal.current) : goal.current}
                    </span>
                    <span className="text-xs text-text-tertiary ml-1">
                      / {isCurrency ? formatCurrency(goal.target) : goal.target}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <div className="h-2.5 bg-surface-raised rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700 ease-out", goal.color)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="absolute right-0 -top-5 text-xs font-medium text-text-tertiary">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
