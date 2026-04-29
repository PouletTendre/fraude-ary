import { Bitcoin, TrendingUp, PieChart, Building2, Landmark, type LucideIcon } from "lucide-react";

export const ASSET_TYPES = ["crypto", "stocks", "etf", "real_estate", "commodity"] as const;
export type AssetType = typeof ASSET_TYPES[number];

export interface AssetTypeConfig {
  label: string;
  chartColor: string;
  badgeVariant: string;
  badgeClass: string;
  icon: LucideIcon;
}

export const ASSET_TYPE_CONFIG: Record<AssetType, AssetTypeConfig> = {
  crypto: {
    label: "Crypto",
    chartColor: "#F59E0B",
    badgeVariant: "warning",
    badgeClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    icon: Bitcoin,
  },
  stocks: {
    label: "Actions",
    chartColor: "#3B82F6",
    badgeVariant: "info",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    icon: TrendingUp,
  },
  etf: {
    label: "ETF",
    chartColor: "#10B981",
    badgeVariant: "success",
    badgeClass: "bg-green-500/10 text-green-600 dark:text-green-400",
    icon: PieChart,
  },
  real_estate: {
    label: "Immobilier",
    chartColor: "#6366F1",
    badgeVariant: "accent",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    icon: Building2,
  },
  commodity: {
    label: "Matière",
    chartColor: "#9CA3AF",
    badgeVariant: "muted",
    badgeClass: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    icon: Landmark,
  },
};

export const ASSET_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "Tous les types" },
  ...ASSET_TYPES.filter((t) => t !== "commodity").map((t) => ({
    value: t,
    label: ASSET_TYPE_CONFIG[t].label,
  })),
];

export function getAssetTypeLabel(type: string): string {
  return ASSET_TYPE_CONFIG[type as AssetType]?.label ?? type.replace("_", " ");
}

export function getAssetTypeChartColor(type: string): string {
  return ASSET_TYPE_CONFIG[type as AssetType]?.chartColor ?? "#9CA3AF";
}

export function getAssetTypeVariant(type: string): string {
  return ASSET_TYPE_CONFIG[type as AssetType]?.badgeVariant ?? "neutral";
}
