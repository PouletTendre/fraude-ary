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
        background: "var(--surface)",
        borderRadius: 0,
        padding: "20px 24px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-body)",
          textTransform: "uppercase",
          letterSpacing: "1px",
          fontSize: "0.75rem",
          fontWeight: 400,
          color: "var(--text-tertiary)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "1.5rem",
          fontWeight: 400,
          letterSpacing: "normal",
          color: "var(--text-primary)",
        }}
      >
        {value}
      </span>
      {delta && (
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.8125rem",
            fontWeight: 400,
            color: deltaColorVar,
          }}
        >
          {prefix} {delta}
        </span>
      )}
    </div>
  );
}
