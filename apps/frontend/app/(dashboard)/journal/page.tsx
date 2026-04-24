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
import { Pencil, Trash2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CHF: "CHF",
};

const formatCurrency = (value: number, currency: string = "USD") => {
  const symbol = CURRENCY_SYMBOLS[currency] || "$";
  return `${symbol}${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
};

export default function JournalPage() {
  const { data: transactions, isLoading, updateTransaction, deleteTransaction, isUpdating, isDeleting } = useTransactions();
  const { addToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

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
        <h1 className="text-3xl font-bold text-text-primary">Journal</h1>
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
                                  value={editForm.quantity || ""}
                                  onChange={(e) => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) })}
                                  className="h-8 w-full rounded-md border border-border bg-surface-sunken px-2 text-sm text-text-primary text-right"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="number"
                                  step="any"
                                  value={editForm.unit_price || ""}
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
                                  value={editForm.fees || ""}
                                  onChange={(e) => setEditForm({ ...editForm, fees: parseFloat(e.target.value) })}
                                  className="h-8 w-full rounded-md border border-border bg-surface-sunken px-2 text-sm text-text-primary text-right"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="number"
                                  step="any"
                                  value={editForm.total_invested || ""}
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
                                <Badge variant={tx.type === "buy" ? "success" : "error"}>
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
                                {tx.quantity}
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
