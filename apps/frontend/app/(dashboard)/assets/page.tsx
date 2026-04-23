"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAssets } from "@/hooks/useAssets";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Search, Filter, X, ArrowUpDown, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Asset } from "@/types";

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "crypto", label: "Crypto" },
  { value: "stocks", label: "Stocks" },
  { value: "real_estate", label: "Real Estate" },
];

type SortField = "name" | "value" | "performance";
type SortDirection = "asc" | "desc";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const generateMockHistory = (basePrice: number, days: number = 30) => {
  const history = [];
  let price = basePrice * 0.9;
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    price = price * (1 + (Math.random() - 0.48) * 0.05);
    history.push({
      date: date.toISOString().split("T")[0],
      price: parseFloat(price.toFixed(2)),
    });
  }
  return history;
};

export default function AssetsPage() {
  const router = useRouter();
  const { assets, isLoading, createAsset, deleteAsset, isCreating, isDeleting } = useAssets();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("value");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
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
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.symbol && asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = typeFilter === "all" || asset.type === typeFilter;
      return matchesSearch && matchesType;
    });
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
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
    const priceHistory = generateMockHistory(selectedAsset.current_price);
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
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{selectedAsset.name}</h1>
            {selectedAsset.symbol && (
              <p className="text-gray-500 dark:text-gray-400">{selectedAsset.symbol}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current Price</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    ${formatCurrency(selectedAsset.current_price)}
                  </p>
                </div>
                {performance >= 0 ? (
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                    <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  ${formatCurrency(currentValue)}
                </p>
                <p className="text-sm text-gray-500 mt-1">{selectedAsset.quantity} units</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Performance</p>
                <p className={cn("text-2xl font-bold mt-1", performance >= 0 ? "text-green-600" : "text-red-600")}>
                  {performance >= 0 ? "+" : ""}{performance.toFixed(2)}%
                </p>
                <p className={cn("text-sm mt-1", gainLoss >= 0 ? "text-green-600" : "text-red-600")}>
                  {gainLoss >= 0 ? "+" : ""}${formatCurrency(gainLoss)}
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
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={performance >= 0 ? "#10B981" : "#EF4444"} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={performance >= 0 ? "#10B981" : "#EF4444"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `$${formatCurrency(v)}`} />
                  <Tooltip formatter={(value: number) => `$${formatCurrency(value)}`} />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={performance >= 0 ? "#10B981" : "#EF4444"}
                    strokeWidth={2}
                    fill="url(#priceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                <Badge variant={
                  selectedAsset.type === "crypto" ? "warning" :
                  selectedAsset.type === "stocks" ? "success" : "info"
                }>
                  {selectedAsset.type.replace("_", " ")}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Purchase Price</p>
                <p className="text-gray-900 dark:text-gray-100">${formatCurrency(selectedAsset.purchase_price)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Quantity</p>
                <p className="text-gray-900 dark:text-gray-100">{selectedAsset.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Purchase Date</p>
                <p className="text-gray-900 dark:text-gray-100">{new Date(selectedAsset.purchase_date).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      {filteredAndSortedAssets.length === 0 ? (
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
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Name
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Purchase Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Price</th>
                    <th
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort("performance")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Change
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort("value")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Value
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gain/Loss</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
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
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => setSelectedAsset(asset)}
                      >
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
                        <td className="px-4 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
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
