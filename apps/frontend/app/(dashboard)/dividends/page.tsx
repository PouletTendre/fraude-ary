"use client";

import { useState } from "react";
import { useDividends } from "@/hooks/useDividends";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { Section } from "@/components/ui/Section";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { DollarSign, TrendingUp, Hash, Trophy, Trash2, Plus } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell,
} from "recharts";

const BAR_COLOR = "#10B981";

export default function DividendsPage() {
  const {
    data: dividends,
    summary,
    isLoading,
    isLoadingSummary,
    createDividend,
    deleteDividend,
    isCreating,
    isDeleting,
  } = useDividends();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    symbol: "",
    amount_per_share: "",
    quantity: "",
    currency: "USD",
    date: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.symbol.trim()) {
      errors.symbol = "Symbol is required";
    } else if (!/^[A-Z0-9.\-]{1,20}$/.test(formData.symbol.toUpperCase())) {
      errors.symbol = "Symbol must be 1-20 characters (letters, numbers, dots, hyphens)";
    }
    if (!formData.amount_per_share || parseFloat(formData.amount_per_share) <= 0) {
      errors.amount_per_share = "Valid amount per share required";
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      errors.quantity = "Valid quantity required";
    }
    if (!formData.date) {
      errors.date = "Date is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    createDividend(
      {
        symbol: formData.symbol.toUpperCase(),
        amount_per_share: parseFloat(formData.amount_per_share),
        quantity: parseFloat(formData.quantity),
        currency: formData.currency,
        date: formData.date,
      },
      {
        onSuccess: () => {
          addToast("Dividend created successfully!", "success");
          setFormData({ symbol: "", amount_per_share: "", quantity: "", currency: "USD", date: "" });
          setShowForm(false);
        },
        onError: (error: Error) => {
          addToast(`Failed to create dividend: ${error.message}`, "error");
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this dividend?")) {
      deleteDividend(id, {
        onSuccess: () => addToast("Dividend deleted", "success"),
        onError: () => addToast("Failed to delete dividend", "error"),
      });
    }
  };

  const topSymbol = summary?.total_by_symbol
    ? Object.entries(summary.total_by_symbol).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-"
    : "-";

  if (isLoading) {
    return (
      <PageTransition>
        <Section variant="hero">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </Section>
        <Section variant="editorial">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-[20px]">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </Section>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Section variant="hero">
        <h1 style={{
          fontSize: "1.625rem", fontWeight: 500,
          letterSpacing: "normal", color: "var(--text-primary)", margin: 0,
        }}>
          Dividendes
        </h1>
        <p style={{
          fontSize: "0.8125rem", color: "var(--text-secondary)",
          marginTop: "8px", fontFamily: "var(--font-body)",
          textTransform: "uppercase", letterSpacing: "1px",
        }}>
          Suivi des dividendes
        </p>
      </Section>

      <Section variant="editorial">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div />
            <Button onClick={() => setShowForm(!showForm)} disabled={isCreating}>
              {showForm ? "Annuler" : <><Plus className="w-4 h-4" /> Ajouter Dividende</>}
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-[20px]">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-tertiary">Total Dividendes</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">
                      {formatCurrency(summary?.total_dividends ?? 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-primary-subtle rounded-full">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-tertiary">Rendement sur coût</p>
                    <p className="text-2xl font-bold text-gain mt-1">
                      {(summary?.yield_on_cost ?? 0).toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-3 bg-gain-muted rounded-full">
                    <TrendingUp className="w-6 h-6 text-gain" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-tertiary">Nombre de dividendes</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">
                      {summary?.count ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-primary-subtle rounded-full">
                    <Hash className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-tertiary">Meilleur Symbole</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">
                      {topSymbol}
                    </p>
                  </div>
                  <div className="p-3 bg-primary-subtle rounded-full">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Create Dividend Form */}
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>Ajouter Dividende</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    <Input
                      label="Symbol"
                      placeholder="e.g. AAPL"
                      value={formData.symbol}
                      onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                      error={formErrors.symbol}
                    />
                    <Input
                      label="Amount / Share"
                      type="number"
                      step="any"
                      value={formData.amount_per_share}
                      onChange={(e) => setFormData({ ...formData, amount_per_share: e.target.value })}
                      error={formErrors.amount_per_share}
                    />
                    <Input
                      label="Quantity"
                      type="number"
                      step="any"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      error={formErrors.quantity}
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
                      label="Date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      error={formErrors.date}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? "Création..." : "Ajouter Dividende"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                      Annuler
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Monthly History Chart */}
          {summary?.monthly_history && summary.monthly_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historique mensuel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.monthly_history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => formatCurrency(v)} width={80} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), "Dividends"]} />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={32}>
                        {summary.monthly_history.map((_, index) => (
                          <Cell key={index} fill={BAR_COLOR} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dividends Table */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des dividendes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-surface-sunken border-b border-border">
                    <tr>
                      <th
                        className="px-4 py-3 text-left font-normal text-xs text-text-tertiary uppercase tracking-[1px]"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        Date
                      </th>
                      <th
                        className="px-4 py-3 text-left font-normal text-xs text-text-tertiary uppercase tracking-[1px]"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        Symbole
                      </th>
                      <th
                        className="px-4 py-3 text-right font-normal text-xs text-text-tertiary uppercase tracking-[1px]"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        Montant / Action
                      </th>
                      <th
                        className="px-4 py-3 text-right font-normal text-xs text-text-tertiary uppercase tracking-[1px]"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        Quantité
                      </th>
                      <th
                        className="px-4 py-3 text-right font-normal text-xs text-text-tertiary uppercase tracking-[1px]"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        Total
                      </th>
                      <th
                        className="px-4 py-3 text-left font-normal text-xs text-text-tertiary uppercase tracking-[1px]"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        Devise
                      </th>
                      <th
                        className="px-4 py-3 text-center font-normal text-xs text-text-tertiary uppercase tracking-[1px]"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dividends && dividends.length > 0 ? (
                      dividends.map((d) => (
                        <tr key={d.id} className="hover:bg-surface-raised">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary">
                            {new Date(d.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                            {d.symbol.toUpperCase()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-text-primary">
                            {formatCurrency(d.amount_per_share, d.currency)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-text-primary">
                            {formatNumber(d.quantity)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-gain">
                            {formatCurrency(d.total_amount, d.currency)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary">
                            {d.currency}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleDelete(d.id)}
                              disabled={isDeleting}
                              className="p-1.5 rounded-md text-text-secondary hover:text-loss hover:bg-loss-muted transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-text-tertiary">
                          Aucun dividende enregistré.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>
    </PageTransition>
  );
}
