"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAssets } from "@/hooks/useAssets";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { SymbolSearch } from "@/components/SymbolSearch";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Search, Filter, X, ArrowUpDown, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { cn, formatNumber, formatCurrency } from "@/lib/utils";
import type { Asset } from "@/types";

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "crypto", label: "Crypto" },
  { value: "stocks", label: "Stocks" },
  { value: "real_estate", label: "Real Estate" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "JPY", label: "JPY" },
  { value: "CHF", label: "CHF" },
];

type SortField = "symbol" | "value" | "performance";
type SortDirection = "asc" | "desc";

export default function AssetsPage() {
  const router = useRouter();
  const { assets, isLoading, createAsset, updateAsset, deleteAsset, bulkDeleteAssets, isCreating, isUpdating, isDeleting, isBulkDeleting } = useAssets();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("symbol");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    type: "crypto" as "crypto" | "stocks" | "real_estate",
    symbol: "",
    quantity: "",
    purchase_price: "",
    purchase_date: "",
    currency: "USD",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [priceHistory, setPriceHistory] = useState<{ date: string; price: number }[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editFormData, setEditFormData] = useState({
    quantity: "",
    purchase_price: "",
    currency: "USD",
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!selectedAsset) {
      setPriceHistory([]);
      return;
    }
    setIsHistoryLoading(true);
    fetchApi<{ history: { price: number; timestamp: string }[] }>(`/api/v1/assets/${selectedAsset.id}/history`)
      .then((data) => {
        const mapped = (data.history || [])
          .map((h) => ({
            date: h.timestamp ? h.timestamp.split("T")[0] : "",
            price: h.price,
          }))
          .reverse();
        setPriceHistory(mapped);
      })
      .catch(() => {
        setPriceHistory([]);
      })
      .finally(() => setIsHistoryLoading(false));
  }, [selectedAsset]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.symbol.trim()) {
      newErrors.symbol = "Symbol is required";
    } else if (!/^[A-Z0-9.\-]{1,20}$/.test(formData.symbol.toUpperCase())) {
      newErrors.symbol = "Symbol must be 1-20 characters (letters, numbers, dots, hyphens)";
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = "Valid quantity required (greater than 0)";
    }
    if (!formData.purchase_price || parseFloat(formData.purchase_price) <= 0) {
      newErrors.purchase_price = "Valid price required (greater than 0)";
    }
    if (!formData.purchase_date) {
      newErrors.purchase_date = "Purchase date is required";
    } else {
      const selectedDate = new Date(formData.purchase_date);
      const today = new Date();
      if (selectedDate > today) {
        newErrors.purchase_date = "Purchase date cannot be in the future";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const assetData = {
        type: formData.type,
        symbol: formData.symbol.toUpperCase(),
        quantity: parseFloat(formData.quantity),
        purchase_price: parseFloat(formData.purchase_price),
        purchase_date: formData.purchase_date,
        currency: formData.currency,
      };
      
      createAsset(assetData, {
        onSuccess: (data) => {
          addToast("Asset created successfully!", "success");
          setFormData({ type: "crypto", symbol: "", quantity: "", purchase_price: "", purchase_date: "", currency: "USD" });
          setShowForm(false);
        },
        onError: (error: Error) => {
          console.error("[handleSubmit] Error creating asset:", error);
          const errorMsg = error.message || "Unknown error";
          addToast(`Failed to create asset: ${errorMsg}`, "error");
        },
      });
    }
  };

  const validateEdit = () => {
    const newErrors: Record<string, string> = {};
    if (!editFormData.quantity || parseFloat(editFormData.quantity) <= 0) {
      newErrors.quantity = "Valid quantity required (greater than 0)";
    }
    if (!editFormData.purchase_price || parseFloat(editFormData.purchase_price) <= 0) {
      newErrors.purchase_price = "Valid price required (greater than 0)";
    }
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateEdit() && editingAsset) {
      updateAsset(
        {
          id: editingAsset.id,
          quantity: parseFloat(editFormData.quantity),
          purchase_price: parseFloat(editFormData.purchase_price),
          currency: editFormData.currency,
        },
        {
          onSuccess: () => {
            addToast("Asset updated successfully!", "success");
            setEditingAsset(null);
          },
          onError: (error: Error) => {
            addToast(`Failed to update asset: ${error.message}`, "error");
          },
        }
      );
    }
  };

  const handleEditCancel = () => {
    setEditingAsset(null);
    setEditErrors({});
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      deleteAsset(id, {
        onSuccess: () => {
          addToast("Asset deleted successfully!", "success");
        },
        onError: () => {
          addToast("Failed to delete asset", "error");
        },
      });
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedAssets.size} assets?`)) {
      bulkDeleteAssets(Array.from(selectedAssets), {
        onSuccess: () => {
          addToast("Assets deleted successfully!", "success");
          setSelectedAssets(new Set());
        },
        onError: () => {
          addToast("Failed to delete assets", "error");
        },
      });
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const filteredAndSortedAssets = useMemo(() => {
    if (!assets) return [];
    let filtered = assets.filter((asset) => {
      const matchesSearch = asset.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || asset.type === typeFilter;
      return matchesSearch && matchesType;
    });
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "symbol":
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case "value":
          comparison = (a.current_price * a.quantity) - (b.current_price * b.quantity);
          break;
        case "performance":
          const perfA = ((a.current_price - a.purchase_price) / a.purchase_price) * 100;
          const perfB = ((b.current_price - b.purchase_price) / b.purchase_price) * 100;
          comparison = perfA - perfB;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return filtered;
  }, [assets, searchQuery, typeFilter, sortField, sortDirection]);

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
  };

  const hasActiveFilters = searchQuery !== "" || typeFilter !== "all";

  if (selectedAsset) {
    const currentValue = selectedAsset.current_price * selectedAsset.quantity;
    const totalCost = selectedAsset.purchase_price * selectedAsset.quantity;
    const gainLoss = currentValue - totalCost;
    const gainLossPercent = ((selectedAsset.current_price - selectedAsset.purchase_price) / selectedAsset.purchase_price) * 100;
    const performance = gainLossPercent;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedAsset(null)}
            className="p-2 rounded-lg hover:bg-surface-raised text-text-secondary text-text-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{selectedAsset.symbol.toUpperCase()}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">Current Price</p>
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    {formatCurrency(selectedAsset.current_price, selectedAsset.currency)}
                  </p>
                </div>
                {performance >= 0 ? (
                  <div className="p-3 bg-gain-muted rounded-full">
                    <TrendingUp className="w-6 h-6 text-gain" />
                  </div>
                ) : (
                  <div className="p-3 bg-loss-muted rounded-full">
                    <TrendingDown className="w-6 h-6 text-loss" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-text-tertiary">Total Value</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {formatCurrency(currentValue, selectedAsset.currency)}
                </p>
                <p className="text-sm text-text-tertiary mt-1">{formatNumber(selectedAsset.quantity)} units</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-text-tertiary">Performance</p>
                <p className={cn("text-2xl font-bold mt-1", performance >= 0 ? "text-gain" : "text-loss")}>
                  {performance >= 0 ? "+" : ""}{performance.toFixed(2)}%
                </p>
                <p className={cn("text-sm mt-1", gainLoss >= 0 ? "text-gain" : "text-loss")}>
                  {gainLoss >= 0 ? "+" : ""}{formatCurrency(gainLoss, selectedAsset.currency)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Price History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isHistoryLoading ? (
                <div className="flex items-center justify-center h-full text-text-tertiary">Loading history...</div>
              ) : priceHistory.length === 0 ? (
                <div className="flex items-center justify-center h-full text-text-tertiary">No history available</div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={performance >= 0 ? "#10B981" : "#EF4444"} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={performance >= 0 ? "#10B981" : "#EF4444"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => formatCurrency(v, selectedAsset.currency)} />
                  <Tooltip formatter={(value: number) => formatCurrency(value, selectedAsset.currency)} />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={performance >= 0 ? "#10B981" : "#EF4444"}
                    strokeWidth={2}
                    fill="url(#priceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-tertiary">Type</p>
                <Badge variant={
                  selectedAsset.type === "crypto" ? "warning" :
                  selectedAsset.type === "stocks" ? "gain" : "info"
                }>
                  {selectedAsset.type.replace("_", " ")}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Purchase Price</p>
                <p className="text-text-primary">{formatCurrency(selectedAsset.purchase_price, selectedAsset.currency)}</p>
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Quantity</p>
                <p className="text-text-primary">{formatNumber(selectedAsset.quantity)}</p>
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Purchase Date</p>
                <p className="text-text-primary">{new Date(selectedAsset.purchase_date).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-text-primary">Assets</h1>
        <Button onClick={() => setShowForm(!showForm)} disabled={isCreating}>
          {showForm ? "Cancel" : "+ Add Asset"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Asset</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SymbolSearch
                  value={formData.symbol}
                  onChange={(symbol) => setFormData({ ...formData, symbol })}
                  error={errors.symbol}
                  assetType={formData.type}
                />
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "crypto" | "stocks" | "real_estate" })}
                    className="flex h-10 w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm"
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Quantity"
                  type="number"
                  step="any"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  error={errors.quantity}
                />
                <Input
                  label="Purchase Price"
                  type="number"
                  step="any"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  error={errors.purchase_price}
                />
                <Input
                  label="Purchase Date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  error={errors.purchase_date}
                />
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm"
                  >
                    {CURRENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Add Asset"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {editingAsset && (
        <Card>
          <CardHeader>
            <CardTitle>Edit {editingAsset.symbol.toUpperCase()}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Quantity"
                  type="number"
                  step="any"
                  value={editFormData.quantity}
                  onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                  error={editErrors.quantity}
                />
                <Input
                  label="Purchase Price"
                  type="number"
                  step="any"
                  value={editFormData.purchase_price}
                  onChange={(e) => setEditFormData({ ...editFormData, purchase_price: e.target.value })}
                  error={editErrors.purchase_price}
                />
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Currency
                  </label>
                  <select
                    value={editFormData.currency}
                    onChange={(e) => setEditFormData({ ...editFormData, currency: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm"
                  >
                    {CURRENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="secondary" onClick={handleEditCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-surface text-text-primary text-sm placeholder:text-text-muted"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      {filteredAndSortedAssets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            {assets.length === 0 ? (
              <p className="text-text-tertiary">No assets yet. Add your first asset to get started.</p>
            ) : (
              <>
                <p className="text-text-tertiary">No assets match your filters.</p>
                <button onClick={clearFilters} className="text-primary hover:underline dark:text-primary-hover mt-2">
                  Clear filters
                </button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {selectedAssets.size > 0 && (
              <div className="px-4 py-3 border-b border-border flex justify-between items-center">
                <span className="text-sm text-text-secondary text-text-muted">
                  {selectedAssets.size} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="text-loss hover:text-red-800 dark:text-loss dark:hover:text-loss text-sm disabled:opacity-50"
                >
                  {isBulkDeleting ? "Deleting..." : `Delete ${selectedAssets.size} selected`}
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-surface-sunken border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={filteredAndSortedAssets.length > 0 && filteredAndSortedAssets.every((a) => selectedAssets.has(a.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAssets(new Set(filteredAndSortedAssets.map((a) => a.id)));
                          } else {
                            setSelectedAssets(new Set());
                          }
                        }}
                        className="rounded border-border bg-surface-raised"
                      />
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider cursor-pointer hover:bg-surface-raised"
                      onClick={() => handleSort("symbol")}
                    >
                      <div className="flex items-center gap-1">
                        Symbol
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Purchase Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Current Price</th>
                    <th
                      className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider cursor-pointer hover:bg-surface-raised"
                      onClick={() => handleSort("performance")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Change
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider cursor-pointer hover:bg-surface-raised"
                      onClick={() => handleSort("value")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Value
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Gain/Loss</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-text-tertiary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAndSortedAssets.map((asset) => {
                    const value = asset.current_price * asset.quantity;
                    const gainLoss = (asset.current_price - asset.purchase_price) * asset.quantity;
                    const gainLossPercent = ((asset.current_price - asset.purchase_price) / asset.purchase_price) * 100;
                    const lastUpdated = asset.last_updated ? new Date(asset.last_updated).toLocaleString() : null;
                    return (
                      <tr
                        key={asset.id}
                        className="hover:bg-surface-raised cursor-pointer"
                        onClick={() => setSelectedAsset(asset)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedAssets.has(asset.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedAssets);
                              if (e.target.checked) {
                                newSet.add(asset.id);
                              } else {
                                newSet.delete(asset.id);
                              }
                              setSelectedAssets(newSet);
                            }}
                            className="rounded border-border bg-surface-raised"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-medium text-text-primary">{asset.symbol.toUpperCase()}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant={
                            asset.type === "crypto" ? "warning" :
                            asset.type === "stocks" ? "gain" : "info"
                          }>
                            {asset.type.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-text-primary">{formatNumber(asset.quantity)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-text-primary">
                          {formatCurrency(asset.purchase_price, asset.currency)}
                          {asset.purchase_price_eur !== undefined && asset.currency !== "EUR" && (
                            <div className="text-[11px] text-text-tertiary mt-0.5">
                              ≈ {formatCurrency(asset.purchase_price_eur, "EUR")}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-text-primary">
                          {formatCurrency(asset.current_price, asset.currency)}
                          {lastUpdated && <div className="text-xs text-text-muted">{lastUpdated}</div>}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          {gainLossPercent >= 0 ? (
                            <span className="text-gain font-medium">↑ {gainLossPercent.toFixed(2)}%</span>
                          ) : (
                            <span className="text-loss font-medium">↓ {Math.abs(gainLossPercent).toFixed(2)}%</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right font-medium text-text-primary">{formatCurrency(value, asset.currency)}</td>
                        <td className={`px-4 py-4 whitespace-nowrap text-right font-medium ${gainLoss >= 0 ? "text-gain" : "text-loss"}`}>
                          {gainLoss >= 0 ? "+" : ""}{formatCurrency(gainLoss, asset.currency)} ({gainLossPercent.toFixed(2)}%)
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditingAsset(asset);
                              setEditFormData({
                                quantity: formatNumber(asset.quantity),
                                purchase_price: formatNumber(asset.purchase_price),
                                currency: asset.currency,
                              });
                            }}
                            aria-label={`Modifier ${asset.symbol}`}
                            className="text-text-secondary hover:text-primary text-sm mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(asset.id)}
                            disabled={isDeleting}
                            aria-label={`Supprimer ${asset.symbol}`}
                            className="text-loss hover:text-red-800 dark:text-loss dark:hover:text-loss text-sm disabled:opacity-50"
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </PageTransition>
  );
}
