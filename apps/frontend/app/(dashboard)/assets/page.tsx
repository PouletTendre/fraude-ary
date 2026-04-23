"use client";

import { useState, useMemo } from "react";
import { useAssets } from "@/hooks/useAssets";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { Search, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "crypto", label: "Crypto" },
  { value: "stocks", label: "Stocks" },
  { value: "real_estate", label: "Real Estate" },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export default function AssetsPage() {
  const { assets, isLoading, createAsset, deleteAsset, isCreating, isDeleting } = useAssets();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    type: "crypto" as "crypto" | "stocks" | "real_estate",
    symbol: "",
    quantity: "",
    purchase_price: "",
    purchase_date: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (formData.symbol && !/^[A-Z0-9]{1,10}$/.test(formData.symbol.toUpperCase())) {
      newErrors.symbol = "Symbol must be 1-10 alphanumeric characters";
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
      createAsset({
        name: formData.name,
        type: formData.type,
        symbol: formData.symbol || undefined,
        quantity: parseFloat(formData.quantity),
        purchase_price: parseFloat(formData.purchase_price),
        purchase_date: formData.purchase_date,
      }, {
        onSuccess: () => {
          addToast("Asset created successfully!", "success");
          setFormData({ name: "", type: "crypto", symbol: "", quantity: "", purchase_price: "", purchase_date: "" });
          setShowForm(false);
        },
        onError: () => {
          addToast("Failed to create asset", "error");
        },
      });
    }
  };

  const handleDelete = (id: number) => {
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

  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    return assets.filter((asset) => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.symbol && asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = typeFilter === "all" || asset.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [assets, searchQuery, typeFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
  };

  const hasActiveFilters = searchQuery !== "" || typeFilter !== "all";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Assets</h1>
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
                <Input
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                  placeholder="Bitcoin, Apple Stock..."
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "crypto" | "stocks" | "real_estate" })}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600"
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Symbol (optional)"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  placeholder="BTC, AAPL..."
                />
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
              </div>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Add Asset"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
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

      {filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            {assets.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No assets yet. Add your first asset to get started.</p>
            ) : (
              <>
                <p className="text-gray-500 dark:text-gray-400">No assets match your filters.</p>
                <button onClick={clearFilters} className="text-blue-600 hover:underline dark:text-blue-400 mt-2">
                  Clear filters
                </button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Purchase Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Change</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Value</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gain/Loss</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAssets.map((asset) => {
                    const value = asset.current_price * asset.quantity;
                    const gainLoss = (asset.current_price - asset.purchase_price) * asset.quantity;
                    const gainLossPercent = ((asset.current_price - asset.purchase_price) / asset.purchase_price) * 100;
                    const lastUpdated = asset.last_updated ? new Date(asset.last_updated).toLocaleString() : null;
                    return (
                      <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{asset.name}</div>
                          {asset.symbol && <div className="text-sm text-gray-500 dark:text-gray-400">{asset.symbol}</div>}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant={
                            asset.type === "crypto" ? "warning" :
                            asset.type === "stocks" ? "success" : "info"
                          }>
                            {asset.type.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-gray-900 dark:text-gray-100">{asset.quantity}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-gray-900 dark:text-gray-100">${formatCurrency(asset.purchase_price)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-gray-900 dark:text-gray-100">
                          ${formatCurrency(asset.current_price)}
                          {lastUpdated && <div className="text-xs text-gray-400">{lastUpdated}</div>}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          {gainLossPercent >= 0 ? (
                            <span className="text-green-600 dark:text-green-400 font-medium">↑ {gainLossPercent.toFixed(2)}%</span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400 font-medium">↓ {Math.abs(gainLossPercent).toFixed(2)}%</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right font-medium text-gray-900 dark:text-gray-100">${formatCurrency(value)}</td>
                        <td className={`px-4 py-4 whitespace-nowrap text-right font-medium ${gainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {gainLoss >= 0 ? "+" : ""}${formatCurrency(gainLoss)} ({gainLossPercent.toFixed(2)}%)
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleDelete(asset.id)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm disabled:opacity-50"
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
  );
}
