export function RsiGauge({ value }: { value: number | null }) {
  const pct = value !== null ? Math.max(0, Math.min(100, value)) : 0;
  const color =
    value === null
      ? "var(--text-muted)"
      : value > 70
        ? "var(--loss)"
        : value < 30
          ? "var(--gain)"
          : "var(--warning)";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-small text-text-secondary">RSI (14)</span>
        <span className="text-h3 font-tnum" style={{ color }}>
          {value !== null ? value.toFixed(1) : "--"}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={value !== null ? Math.round(value) : 0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`RSI ${value !== null ? value.toFixed(1) : "non disponible"}`}
        className="h-2 rounded-full bg-surface-sunken overflow-hidden"
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-text-muted">
        <span>0</span>
        <span className={value !== null && value < 30 ? "text-gain w-590" : ""}>
          30
        </span>
        <span
          className={
            value !== null && value >= 30 && value <= 70
              ? "text-warning w-590"
              : ""
          }
        >
          50
        </span>
        <span className={value !== null && value > 70 ? "text-loss w-590" : ""}>
          70
        </span>
        <span>100</span>
      </div>
    </div>
  );
}
