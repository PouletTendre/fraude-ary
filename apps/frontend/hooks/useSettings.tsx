"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Currency = "USD" | "EUR";
export type DateFormat = "fr" | "us" | "iso";

interface Settings {
  currency: Currency;
  dateFormat: DateFormat;
}

interface SettingsContextType {
  settings: Settings;
  setCurrency: (currency: Currency) => void;
  setDateFormat: (format: DateFormat) => void;
  formatCurrency: (value: number, currency?: string) => string;
  formatDate: (date: string | Date) => string;
}

const defaultSettings: Settings = {
  currency: "USD",
  dateFormat: "fr",
};

function getStoredSettings(): Settings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const stored = localStorage.getItem("fraude-ary-settings");
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }
  return defaultSettings;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSettings(getStoredSettings());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("fraude-ary-settings", JSON.stringify(settings));
    }
  }, [settings, mounted]);

  const setCurrency = (currency: Currency) => {
    setSettings((prev) => ({ ...prev, currency }));
  };

  const setDateFormat = (dateFormat: DateFormat) => {
    setSettings((prev) => ({ ...prev, dateFormat }));
  };

  const formatCurrency = (value: number, overrideCurrency?: string): string => {
    const currency = (overrideCurrency || settings.currency) as Currency;
    const symbol = currency === "EUR" ? "€" : "$";
    const locale = currency === "EUR" ? "fr-FR" : "en-US";
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return currency === "EUR" ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
  };

  const formatDate = (date: string | Date): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    const { dateFormat } = settings;

    switch (dateFormat) {
      case "fr":
        return d.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      case "us":
        return d.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      case "iso":
        return d.toISOString().slice(0, 16).replace("T", " ");
      default:
        return d.toLocaleDateString();
    }
  };

  return (
    <SettingsContext.Provider
      value={{ settings, setCurrency, setDateFormat, formatCurrency, formatDate }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
