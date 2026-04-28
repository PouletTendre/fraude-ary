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
  const deltaColor =
    isPositive === null
      ? "text-text-tertiary"
      : isPositive
        ? "text-gain"
        : "text-loss";

  const prefix =
    deltaPrefix || (isPositive === null ? "—" : isPositive ? "▲" : "▼");

  return (
    <div
      className={cn("bg-surface flex flex-col gap-[6px]", className)}
      style={{
        borderRadius: "var(--r-md)",
        padding: "18px 20px",
      }}
    >
      <span
        className="font-body label uppercase"
        style={{
          fontSize: "0.75rem",
          letterSpacing: "1px",
          color: "var(--text-tertiary)",
        }}
      >
        {label}
      </span>
      <span
        className="font-tnum"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "1.375rem",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
        }}
      >
        {value}
      </span>
      {delta && (
        <span
          className={cn("font-tnum", deltaColor)}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.75rem",
            fontWeight: 500,
          }}
        >
          {prefix} {delta}
        </span>
      )}
    </div>
  );
}
