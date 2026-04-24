import { cn } from "@/lib/utils";

const PERIODS = ["1J", "1S", "1M", "3M", "YTD", "1A", "Tout"];

interface TimeFilterChipsProps {
  value: string;
  onChange: (period: string) => void;
}

export function TimeFilterChips({ value, onChange }: TimeFilterChipsProps) {
  return (
    <div className="flex gap-[6px] flex-wrap">
      {PERIODS.map((period) => {
        const isActive = value === period;
        return (
          <button
            key={period}
            onClick={() => onChange(period)}
            className={cn(
              "inline-flex items-center rounded-full cursor-pointer transition-all duration-150 ease-out select-none",
              isActive
                ? "text-primary-hover"
                : "text-text-secondary hover:border-border-hover hover:text-text-primary"
            )}
            style={{
              padding: "5px 12px",
              fontSize: "12px",
              fontWeight: 500,
              background: isActive ? "rgba(99,102,241,0.1)" : "var(--surface-raised)",
              border: isActive ? "1px solid rgba(99,102,241,0.3)" : "1px solid var(--border)",
            }}
          >
            {period}
          </button>
        );
      })}
    </div>
  );
}
