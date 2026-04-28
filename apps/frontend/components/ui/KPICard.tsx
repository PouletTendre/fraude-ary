import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string;
  delta?: string;
  deltaPrefix?: "▲" | "▼" | "—";
  isPositive?: boolean | null;
  className?: string;
}

export function KPICard({
  label,
  value,
  delta,
  deltaPrefix,
  isPositive,
  className,
}: KPICardProps) {
  const deltaColorVar =
    isPositive === null
      ? "var(--text-tertiary)"
      : isPositive
        ? "var(--gain)"
        : "var(--loss)";

  const prefix =
    deltaPrefix || (isPositive === null ? "—" : isPositive ? "▲" : "▼");

  return (
    <div
      className={cn("flex flex-col gap-[8px]", className)}
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-card)",
        boxShadow: "var(--shadow-card)",
        padding: "20px",
      }}
    >
      <span
        style={{
          fontSize: "12px",
          fontWeight: 510,
          color: "var(--text-tertiary)",
        }}
      >
        {label}
      </span>
      <span
        className="font-tnum"
        style={{
          fontSize: "24px",
          fontWeight: 400,
          letterSpacing: "-0.288px",
          color: "var(--text-primary)",
        }}
      >
        {value}
      </span>
      {delta && (
        <span
          style={{
            fontSize: "13px",
            fontWeight: 510,
            color: deltaColorVar,
          }}
        >
          {prefix} {delta}
        </span>
      )}
    </div>
  );
}
