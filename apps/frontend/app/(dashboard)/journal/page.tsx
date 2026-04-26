"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Pencil, Trash2, X, Check, Plus } from "lucide-react";
import { cn, formatNumber, formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/types";

export default function JournalPage() {
  const { data: transactions, isLoading, updateTransaction, createTransaction, deleteTransaction, isUpdating, isCreating, isDeleting } = useTransactions();
  const { addToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: "buy" as "buy" | "sell",
    symbol: "",
    asset_type: "" as "crypto" | "stocks" | "real_estate" | "",
    quantity: "",
    unit_price: "",
    currency: "USD",
    fees: "0",
    date: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditForm({
      symbol: tx.symbol,
      quantity: tx.quantity,
      unit_price: tx.unit_price,
      currency: tx.currency,
      exchange_rate: tx.exchange_rate,
      fees: tx.fees,
      total_invested: tx.total_invested,
      date: tx.date,
      type: tx.type,
      asset_type: tx.asset_type,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleUpdate = (id: string) => {
    updateTransaction(
      { id, ...editForm },
      {
        onSuccess: () => {
          addToast("Transaction updated", "success");
          setEditingId(null);
        },
        onError: () => {
          addToast("Failed to update transaction", "error");
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteTransaction(id, {
        onSuccess: () => addToast("Transaction deleted", "success"),
        onError: () => addToast("Failed to delete transaction", "error"),
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.symbol.trim()) {
      newErrors.symbol = "Symbol is required";
    } else if (!/^[A-Z0-9.\-]{1,20}$/.test(formData.symbol.toUpperCase())) {
      newErrors.symbol = "Symbol must be 1-20 characters (letters, numbers, dots, hyphens)";
    }
    if (!formData.asset_type) {
      newErrors.asset_type = "Asset type is required";
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = "Valid quantity required (greater than 0)";
    }
    if (!formData.unit_price || parseFloat(formData.unit_price) <= 0) {
      newErrors.unit_price = "Valid unit price required (greater than 0)";
    }
    if (!formData.date) {
      newErrors.date = "Date is required";
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const data = {
        type: formData.type,
        symbol: formData.symbol.toUpperCase(),
        asset_type: formData.asset_type,
        quantity: parseFloat(formData.quantity),
        unit_price: parseFloat(formData.unit_price),
        currency: formData.currency,
        fees: parseFloat(formData.fees) || 0,
        date: formData.date,
        total_invested: parseFloat(formData.quantity) * parseFloat(formData.unit_price),
      };
      createTransaction(data, {
        onSuccess: () => {
          addToast("Transaction created successfully!", "success");
          setFormData({ type: "buy", symbol: "", asset_type: "", quantity: "", unit_price: "", currency: "USD", fees: "0", date: "" });
          setShowForm(false);
        },
        onError: (error: Error) => {
          addToast(`Failed to create transaction: ${error.message}`, "error");
        },
      });
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-text-primary">Journal</h1>
          <Button onClick={() => setShowForm(!showForm)} disabled={isCreating}>
            {showForm ? "Cancel" : "+ Add Transaction"}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as "buy" | "sell" })}
                      className="flex h-10 w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm text-text-primary"
                    >
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                    </select>
                  </div>
                  <Input
                    label="Symbol"
                    placeholder="e.g. AAPL"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    error={formErrors.symbol}
                  />
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Asset Type</label>
                    <select
                      value={formData.asset_type}
                      onChange={(e) => setFormData({ ...formData, asset_type: e.target.value as "crypto" | "stocks" | "real_estate" })}
                      className="flex h-10 w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm text-text-primary"
                    >
                      <option value="">Select type</option>
                      <option value="crypto">Crypto</option>
                      <option value="stocks">Stocks</option>
                      <option value="real_estate">Real Estate</option>
                    </select>
                    {formErrors.asset_type && <p className="text-xs text-loss mt-1">{formErrors.asset_type}</p>}
                  </div>
                  <Input
                    label="Quantity"
                    type="number"
                    step="any"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    error={formErrors.quantity}
                  />
                  <Input
                    label="Unit Price"
                    type="number"
                    step="any"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    error={formErrors.unit_price}
                  />
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="flex h-10 w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm text-text-primary"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                      <option value="CHF">CHF</option>
                    </select>
                  </div>
                  <Input
                    label="Fees"
                    type="number"
                    step="any"
                    value={formData.fees}
                    onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
                  />
                  <Input
                    label="Date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    error={formErrors.date}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Add Transaction"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-surface-sunken border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Ticker</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Quantité</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Prix Unitaire</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Devise</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Frais</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Total Investi</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-text-tertiary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions && transactions.length > 0 ? (
                    transactions.map((tx) => {
                      const isEditing = editingId === tx.id;
                      return (
                        <tr key={tx.id} className="hover:bg-surface-raised">
                          {isEditing ? (
                            <>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="date"
                                  value={(editForm.date || "").split("T")[0]}
                                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                  className="h-8 w-full rounded-md border border-border bg-surface-sunken px-2 text-sm text-text-primary"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <select
                                  value={editForm.type || "buy"}
                                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value as "buy" | "sell" })}
                                  className="h-8 w-full rounded-md border border-border bg-surface-sunken px-2 text-sm text-text-primary"
                                >
                                  <option value="buy">BUY</option>
                                  <option value="sell">SELL</option>
                                </select>
                                <p className="text-xs text-text-muted mt-1">Changing type will update your asset holdings.</p>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={editForm.symbol || ""}
                                  onChange={(e) => setEditForm({ ...editForm, symbol: e.target.value.toUpperCase() })}
                                  className="h-8 w-full rounded-md border border-border bg-surface-sunken px-2 text-sm text-text-primary"
                                />
                                <select
                                  value={editForm.asset_type || ""}
                                  onChange={(e) => setEditForm({ ...editForm, asset_type: e.target.value })}
                                  className="h-8 w-full rounded-md border border-border bg-surface-sunken px-2 text-sm text-text-primary mt-1"
                                >
                                  <option value="">Select type</option>
                                  <option value="crypto">Crypto</option>
                                  <option value="stocks">Stocks</option>
                                  <option value="real_estate">Real Estate</option>
                                </select>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="number"
                                  step="any"
                                  value={editForm.quantity !== undefined ? formatNumber(editForm.quantity) : ""}
                                  onChange={(e) => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) })}
                                  className="h-8 w-full rounded-md border border-border bg-surface-sunken px-2 text-sm text-text-primary text-right"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="number"
                                  step="any"
                                  value={editForm.unit_price !== undefined ? formatNumber(editForm.unit_price) : ""}
                                  onChange={(e) => setEditForm({ ...editForm, unit_price: parseFloat(e.target.value) })}
                                  className="h-8 w-full rounded-md border border-border bg-surface-sunken px-2 text-sm text-text-primary text-right"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={editForm.currency || ""}
                                  onChange={(e) => setEditForm({ ...editForm, currency: e.target.value.toUpperCase() })}
                                  className="h-8 w-full rounded-md border border-border bg-surface-sunken px-2 text-sm text-text-primary"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="number"
                                  step="any"
                                  value={editForm.fees !== undefined ? formatNumber(editForm.fees) : ""}
                                  onChange={(e) => setEditForm({ ...editForm, fees: parseFloat(e.target.value) })}
                                  className="h-8 w-full rounded-md border border-border bg-surface-sunken px-2 text-sm text-text-primary text-right"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="number"
                                  step="any"
                                  value={editForm.total_invested !== undefined ? formatNumber(editForm.total_invested) : ""}
                                  onChange={(e) => setEditForm({ ...editForm, total_invested: parseFloat(e.target.value) })}
                                  className="h-8 w-full rounded-md border border-border bg-surface-sunken px-2 text-sm text-text-primary text-right"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleUpdate(tx.id)}
                                    disabled={isUpdating}
                                    className="p-1.5 rounded-md text-gain hover:bg-gain-muted transition-colors"
                                    title="Save"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="p-1.5 rounded-md text-text-tertiary hover:bg-surface-raised transition-colors"
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary">
                                {new Date(tx.date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <Badge variant={tx.type === "buy" ? "gain" : "loss"}>
                                  {tx.type.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                                <div className="flex flex-col">
                                  {tx.symbol.toUpperCase()}
                                  {tx.asset_id && (
                                    <span className="text-xs text-text-muted mt-0.5">Linked: {tx.symbol.toUpperCase()}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-text-primary">
                                {formatNumber(tx.quantity)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-text-primary">
                                {formatCurrency(tx.unit_price, tx.currency)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary">
                                {tx.currency}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-text-primary">
                                {formatCurrency(tx.fees, tx.currency)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-text-primary">
                                {formatCurrency(tx.total_invested, tx.currency)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => startEdit(tx)}
                                    className="p-1.5 rounded-md text-text-secondary hover:text-primary hover:bg-primary-subtle transition-colors"
                                    title="Edit"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(tx.id)}
                                    disabled={isDeleting}
                                    className="p-1.5 rounded-md text-text-secondary hover:text-loss hover:bg-loss-muted transition-colors disabled:opacity-50"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-text-tertiary">
                        No transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
