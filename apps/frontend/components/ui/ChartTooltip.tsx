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
      className={cn("flex flex-col", className)}
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "10px 14px",
        boxShadow: "var(--shadow-lg)",
        gap: "4px",
        minWidth: "120px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 500,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
          marginBottom: "4px",
        }}
      >
        {ticker} · {timestamp}
      </div>
      <div
        className="font-mono font-tnum"
        style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}
      >
        {price}
      </div>
      {delta && (
        <div
          className={cn(
            "font-mono font-tnum",
            isPositive ? "text-gain" : "text-loss"
          )}
          style={{ fontSize: "11px" }}
        >
          {deltaPrefix} {delta}
        </div>
      )}
    </div>
  );
}
