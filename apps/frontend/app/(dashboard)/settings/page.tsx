"use client";

import { useTheme } from "next-themes";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { PageTransition } from "@/components/ui/PageTransition";
import { useSettings, type Currency, type DateFormat } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";
import {
  Moon,
  Sun,
  Monitor,
  DollarSign,
  Euro,
  CalendarDays,
  Settings2,
  Check,
} from "lucide-react";

const currencies: { value: Currency; label: string; icon: React.ReactNode }[] = [
  { value: "USD", label: "US Dollar", icon: <DollarSign className="w-4 h-4" /> },
  { value: "EUR", label: "Euro", icon: <Euro className="w-4 h-4" /> },
];

const dateFormats: { value: DateFormat; label: string; example: string }[] = [
  { value: "fr", label: "French (DD/MM/YYYY)", example: "23/04/2026 14:30" },
  { value: "us", label: "US (MM/DD/YYYY)", example: "04/23/2026 02:30 PM" },
  { value: "iso", label: "ISO (YYYY-MM-DD)", example: "2026-04-23 14:30" },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { settings, setCurrency, setDateFormat } = useSettings();

  return (
    <PageTransition>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-tertiary mt-1">
            Customize your experience and preferences
          </p>
        </div>

        {/* Appearance */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-3 block">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    theme === "light"
                      ? "border-primary bg-primary-subtle dark:bg-primary-muted/30"
                      : "border-border hover:border-border-hover"
                  )}
                >
                  <Sun className="w-6 h-6 text-amber-500" />
                  <span className="text-sm font-medium text-text-secondary">Light</span>
                  {theme === "light" && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    theme === "dark"
                      ? "border-primary bg-primary-subtle dark:bg-primary-muted/30"
                      : "border-border hover:border-border-hover"
                  )}
                >
                  <Moon className="w-6 h-6 text-indigo-500" />
                  <span className="text-sm font-medium text-text-secondary">Dark</span>
                  {theme === "dark" && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    theme === "system"
                      ? "border-primary bg-primary-subtle dark:bg-primary-muted/30"
                      : "border-border hover:border-border-hover"
                  )}
                >
                  <Monitor className="w-6 h-6 text-text-tertiary" />
                  <span className="text-sm font-medium text-text-secondary">System</span>
                  {theme === "system" && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <DollarSign className="w-5 h-5 text-gain" />
            <CardTitle className="text-base">Currency</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="text-sm font-medium text-text-secondary mb-3 block">
              Display Currency
            </label>
            <div className="grid grid-cols-2 gap-3">
              {currencies.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCurrency(c.value)}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                    settings.currency === c.value
                      ? "border-primary bg-primary-subtle dark:bg-primary-muted/30"
                      : "border-border hover:border-border-hover"
                  )}
                >
                  <div className="p-2 rounded-lg bg-surface-raised border border-border">
                    {c.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-text-primary">{c.label}</p>
                    <p className="text-xs text-text-tertiary">{c.value}</p>
                  </div>
                  {settings.currency === c.value && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Date Format */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <CardTitle className="text-base">Date Format</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="text-sm font-medium text-text-secondary mb-3 block">
              Preferred Format
            </label>
            <div className="space-y-2">
              {dateFormats.map((df) => (
                <button
                  key={df.value}
                  onClick={() => setDateFormat(df.value)}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl border-2 transition-all",
                    settings.dateFormat === df.value
                      ? "border-primary bg-primary-subtle dark:bg-primary-muted/30"
                      : "border-border hover:border-border-hover"
                  )}
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-text-primary">{df.label}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{df.example}</p>
                  </div>
                  {settings.dateFormat === df.value && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
