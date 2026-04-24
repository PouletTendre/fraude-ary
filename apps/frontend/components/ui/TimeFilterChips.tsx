import { cn } from "@/lib/utils";

const PERIODS = ["1J", "1S", "1M", "3M", "YTD", "1A", "Tout"];

interface TimeFilterChipsProps {
  value: string;
  onChange: (period: string) => void;
}

export function TimeFilterChips({ value, onChange }: TimeFilterChipsProps) {
  return (
    <div className="flex gap-[6px]">
      {PERIODS.map((period) => {
        const isActive = value === period;
        return (
          <button
            key={period}
            onClick={() => onChange(period)}
            className={cn(
              "px-[12px] py-[5px] rounded-full text-[12px] font-medium transition-all duration-150 ease-out",
              isActive
                ? "bg-primary-subtle border border-primary/30 text-primary-hover"
                : "bg-surface-raised border border-border text-text-secondary hover:border-border-hover hover:text-text-primary"
            )}
          >
            {period}
          </button>
        );
      })}
    </div>
  );
}
