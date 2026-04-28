"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { PageSection } from "@/components/ui/PageSection";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { SymbolSearch } from "@/components/SymbolSearch";
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
      <PageSection>
        <h1 style={{
          fontSize: "1.625rem", fontWeight: 500,
          letterSpacing: "normal", color: "var(--text-primary)", margin: 0,
        }}>
          Journal
        </h1>
        <p style={{
          fontSize: "0.8125rem", color: "var(--text-secondary)",
          marginTop: "8px", fontFamily: "var(--font-body)",
          textTransform: "uppercase", letterSpacing: "1px",
        }}>
          Historique de vos transactions
        </p>
      </PageSection>

      <PageSection>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={() => setShowForm(!showForm)} disabled={isCreating}>
              {showForm ? "Annuler" : "+ Ajouter Transaction"}
            </Button>
          </div>

          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>Ajouter une Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as "buy" | "sell" })}
                        className="flex h-10 w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm text-text-primary"
                      >
                        <option value="buy">Achat</option>
                        <option value="sell">Vente</option>
                      </select>
                    </div>
                    <SymbolSearch
                      value={formData.symbol}
                      onChange={(value) => setFormData({ ...formData, symbol: value })}
                      error={formErrors.symbol}
                      assetType={formData.asset_type as "crypto" | "stocks" | "real_estate" | undefined}
                    />
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Asset Type</label>
                      <select
                        value={formData.asset_type}
                        onChange={(e) => setFormData({ ...formData, asset_type: e.target.value as "crypto" | "stocks" | "real_estate" })}
                        className="flex h-10 w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm text-text-primary"
                      >
                                   <option value="">Sélectionner type</option>
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
                      {isCreating ? "Création..." : "Ajouter Transaction"}
                    </Button>
                    <Button type="button" variant="white" onClick={() => setShowForm(false)}>
                      Annuler
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <h3 style={{
            fontFamily: "var(--font-body)", fontWeight: 500,
            fontSize: "0.9375rem", color: "var(--text-primary)",
            margin: 0,
          }}>
            Historique des Transactions
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead style={{ background: "var(--surface-sunken)", borderBottom: "1px solid var(--border)" }}>
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-normal text-text-tertiary uppercase"
                    style={{ letterSpacing: "1px" }}
                  >
                    Date
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-normal text-text-tertiary uppercase"
                    style={{ letterSpacing: "1px" }}
                  >
                    Type
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-normal text-text-tertiary uppercase"
                    style={{ letterSpacing: "1px" }}
                  >
                    Ticker
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-normal text-text-tertiary uppercase"
                    style={{ letterSpacing: "1px" }}
                  >
                    Quantité
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-normal text-text-tertiary uppercase"
                    style={{ letterSpacing: "1px" }}
                  >
                    Prix Unitaire
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-normal text-text-tertiary uppercase"
                    style={{ letterSpacing: "1px" }}
                  >
                    Devise
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-normal text-text-tertiary uppercase"
                    style={{ letterSpacing: "1px" }}
                  >
                    Frais
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-normal text-text-tertiary uppercase"
                    style={{ letterSpacing: "1px" }}
                  >
                    Total Investi
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-normal text-text-tertiary uppercase"
                    style={{ letterSpacing: "1px" }}
                  >
                    Actions
                  </th>
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
                              <p className="text-xs text-text-muted mt-1">Changer le type mettra à jour vos avoirs.</p>
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
                      <option value="">Sélectionner type</option>
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
                                  className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
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
                      Aucune transaction trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageSection>
    </PageTransition>
  );
}
