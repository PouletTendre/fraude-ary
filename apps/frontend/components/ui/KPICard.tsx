import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string;
  delta?: string;
  deltaPrefix?: "▲" | "▼" | "—";
  isPositive?: boolean | null;
  className?: string;
}

export function KPICard({ label, value, delta, deltaPrefix, isPositive, className }: KPICardProps) {
  const deltaColor = isPositive === null
    ? "text-text-tertiary"
    : isPositive
      ? "text-gain"
      : "text-loss";

  const prefix = deltaPrefix || (isPositive === null ? "—" : isPositive ? "▲" : "▼");

  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-[var(--r-lg)] flex flex-col gap-[6px]",
        className
      )}
      style={{ padding: "18px 20px" }}
    >
      <span
        className="text-[0.75rem] font-medium uppercase tracking-[0.06em]"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </span>
      <span
        className="font-mono font-tnum"
        style={{ fontSize: "1.375rem", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}
      >
        {value}
      </span>
      {delta && (
        <span
          className={cn("font-mono font-tnum", deltaColor)}
          style={{ fontSize: "0.75rem", fontWeight: 500 }}
        >
          {prefix} {delta}
        </span>
      )}
    </div>
  );
}
