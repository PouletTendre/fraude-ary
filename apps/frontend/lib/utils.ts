import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, decimals: number = 2): string {
  return Number(value).toFixed(decimals);
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "\u20ac",
  GBP: "\u00a3",
  JPY: "\u00a5",
  CHF: "Fr.",
};

export function formatCurrency(value: number, currency: string = "EUR"): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency + " ";
  return `${symbol}${formatNumber(value)}`;
}