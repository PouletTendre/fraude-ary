"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { PageTransition } from "@/components/ui/PageTransition";
import { useAlerts, type CreateAlertData } from "@/hooks/useAlerts";
import { useToast } from "@/components/ui/Toast";
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PriceAlert } from "@/types";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

function AlertCard({ alert, onToggle, onDelete, isToggling, isDeleting }: {
  alert: PriceAlert;
  onToggle: (id: number, is_active: boolean) => void;
  onDelete: (id: number) => void;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors hover:border-gray-300 dark:hover:border-gray-600">
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
        alert.condition === "above" ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
      )}>
        {alert.condition === "above" ? (
          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
        ) : (
          <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 dark:text-gray-100 uppercase">
                {alert.symbol}
              </p>
              <Badge variant={alert.is_active ? "success" : "default"}>
                {alert.is_active ? "Active" : "Inactive"}
              </Badge>
              {alert.triggered_at && (
                <Badge variant="warning">Triggered</Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Alert when price goes{" "}
              <span className={cn(
                "font-medium",
                alert.condition === "above" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {alert.condition}
              </span>{" "}
              ${formatCurrency(alert.target_price)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Created {new Date(alert.created_at).toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onToggle(alert.id, !alert.is_active)}
          disabled={isToggling}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50",
            alert.is_active ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              alert.is_active ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
        <button
          onClick={() => onDelete(alert.id)}
          disabled={isDeleting}
          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const { alerts, isLoading, createAlert, toggleAlert, deleteAlert, isCreating, isToggling, isDeleting } = useAlerts();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateAlertData>({
    symbol: "",
    target_price: 0,
    condition: "above",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.symbol.trim()) {
      newErrors.symbol = "Symbol is required";
    } else if (!/^[A-Z0-9]{1,10}$/.test(formData.symbol.toUpperCase())) {
      newErrors.symbol = "Symbol must be 1-10 alphanumeric characters";
    }
    if (!formData.target_price || formData.target_price <= 0) {
      newErrors.target_price = "Valid target price required (greater than 0)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const data = {
        symbol: formData.symbol.toUpperCase(),
        target_price: Number(formData.target_price),
        condition: formData.condition,
      };
      createAlert(data, {
        onSuccess: () => {
          addToast("Alert created successfully!", "success");
          setFormData({ symbol: "", target_price: 0, condition: "above" });
          setShowForm(false);
        },
        onError: (error: any) => {
          const msg = error?.message || "Failed to create alert";
          addToast(msg, "error");
        },
      });
    }
  };

  const handleToggle = (id: number, is_active: boolean) => {
    toggleAlert({ id, is_active }, {
      onSuccess: () => addToast(is_active ? "Alert activated" : "Alert deactivated", "success"),
      onError: () => addToast("Failed to update alert", "error"),
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this alert?")) {
      deleteAlert(id, {
        onSuccess: () => addToast("Alert deleted successfully", "success"),
        onError: () => addToast("Failed to delete alert", "error"),
      });
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-4 w-32 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-600" />
              Price Alerts
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {alerts.length > 0 ? (
                <span>
                  You have <span className="font-medium text-blue-600 dark:text-blue-400">{alerts.filter(a => a.is_active).length}</span> active alert{alerts.filter(a => a.is_active).length !== 1 ? "s" : ""}
                </span>
              ) : (
                "Create alerts to get notified when prices hit your targets."
              )}
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} disabled={isCreating}>
            {showForm ? (
              <>
                <X className="w-4 h-4 mr-2" /> Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" /> New Alert
              </>
            )}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Create New Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Symbol"
                    placeholder="e.g. BTC, AAPL"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    error={errors.symbol}
                  />
                  <Input
                    label="Target Price"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={formData.target_price || ""}
                    onChange={(e) => setFormData({ ...formData, target_price: parseFloat(e.target.value) })}
                    error={errors.target_price}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Condition
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, condition: "above" })}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 h-10 px-3 rounded-lg border text-sm font-medium transition-colors",
                          formData.condition === "above"
                            ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        )}
                      >
                        <TrendingUp className="w-4 h-4" />
                        Above
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, condition: "below" })}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 h-10 px-3 rounded-lg border text-sm font-medium transition-colors",
                          formData.condition === "below"
                            ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        )}
                      >
                        <TrendingDown className="w-4 h-4" />
                        Below
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Alert"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onToggle={handleToggle}
                onDelete={handleDelete}
                isToggling={isToggling}
                isDeleting={isDeleting}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No alerts yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Create your first price alert to get notified when an asset hits your target price.
              </p>
              <Button onClick={() => setShowForm(true)} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Create Alert
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
