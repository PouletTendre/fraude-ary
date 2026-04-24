"use client";

import { useTransactions } from "@/hooks/useTransactions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { Badge } from "@/components/ui/Badge";

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
  const { data: transactions, isLoading } = useTransactions();

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
              <table className="w-full min-w-[800px]">
                <thead className="bg-surface-sunken border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Ticker</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Quantité</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Prix Unitaire</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Devise</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Taux de change</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Frais</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Total Investi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions && transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-surface-raised">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant={tx.type === "buy" ? "success" : "error"}>
                            {tx.type.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                          {tx.symbol.toUpperCase()}
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
                          {tx.exchange_rate.toFixed(4)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-text-primary">
                          {formatCurrency(tx.fees, tx.currency)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-text-primary">
                          {formatCurrency(tx.total_invested, tx.currency)}
                        </td>
                      </tr>
                    ))
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
