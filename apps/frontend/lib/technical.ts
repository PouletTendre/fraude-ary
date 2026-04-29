export function rsiBadge(rsi: number | null): {
  label: string;
  variant: "success" | "neutral" | "subtle";
} {
  if (rsi === null) return { label: "--", variant: "neutral" };
  if (rsi > 70) return { label: "Suracheté", variant: "subtle" };
  if (rsi < 30) return { label: "Survendu", variant: "success" };
  return { label: "Neutre", variant: "neutral" };
}

export function macdBadge(histogram: number | null): {
  label: string;
  variant: "success" | "neutral" | "subtle";
} {
  if (histogram === null) return { label: "--", variant: "neutral" };
  if (histogram > 0) return { label: "Haussier", variant: "success" };
  if (histogram < 0) return { label: "Baissier", variant: "subtle" };
  return { label: "Neutre", variant: "neutral" };
}

export function fmtVal(val: number | null, decimals: number = 2): string {
  if (val === null || val === undefined) return "--";
  return val.toFixed(decimals);
}

export function formatObv(value: number): string {
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(0);
}
