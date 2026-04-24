import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string;
  delta?: string;
  deltaPrefix?: "▲" | "▼" | "—";
  isPositive?: boolean | null; // true = gain, false = loss, null = neutral
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
        "bg-surface border border-border rounded-lg p-[18px_20px] flex flex-col gap-1",
        className
      )}
    >
      <span className="text-label uppercase tracking-wide text-text-tertiary">
        {label}
      </span>
      <span className="font-mono text-mono-lg text-text-primary font-tnum">
        {value}
      </span>
      {delta && (
        <span className={cn("font-mono text-label font-tnum", deltaColor)}>
          {prefix} {delta}
        </span>
      )}
    </div>
  );
}
