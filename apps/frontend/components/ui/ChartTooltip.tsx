import { cn } from "@/lib/utils";

interface ChartTooltipProps {
  ticker: string;
  timestamp: string;
  price: string;
  delta?: string;
  deltaPrefix?: "▲" | "▼";
  isPositive?: boolean;
  className?: string;
}

export function ChartTooltip({
  ticker,
  timestamp,
  price,
  delta,
  deltaPrefix,
  isPositive,
  className,
}: ChartTooltipProps) {
  return (
    <div
      className={cn(
        "bg-surface-raised border border-border rounded-md px-3 py-2 shadow-lg flex flex-col gap-[4px] min-w-[120px]",
        className
      )}
    >
      <div className="text-label text-text-tertiary uppercase tracking-wide">
        {ticker} · {timestamp}
      </div>
      <div className="font-mono text-[15px] font-medium text-text-primary font-tnum">
        {price}
      </div>
      {delta && (
        <div
          className={cn(
            "font-mono text-[11px] font-tnum",
            isPositive ? "text-gain" : "text-loss"
          )}
        >
          {deltaPrefix} {delta}
        </div>
      )}
    </div>
  );
}
