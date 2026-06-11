"use client";

import { useState } from "react";
import { usePlaid } from "@/hooks/usePlaid";
import { useSettings } from "@/hooks/useSettings";
import { PlaidLink } from "@/components/PlaidLink";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";
import { PageSection } from "@/components/ui/PageSection";
import { useToast } from "@/components/ui/Toast";
import { Building2, RefreshCw, Trash2, CreditCard, Wallet } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

interface BankTransaction {
  id: string;
  account_id: string;
  date: string;
  amount: number;
  name: string;
  category: string[] | null;
  pending: boolean;
}

export default function AccountsPage() {
  const { accounts, accountsLoading, syncAccount, deleteAccount, isSyncing, isDeleting } = usePlaid();
  const { formatCurrency } = useSettings();
  const { addToast } = useToast();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const { data: transactions, isLoading: transactionsLoading } = useQuery<BankTransaction[]>({
    queryKey: ["plaid-transactions", selectedAccount],
    queryFn: () => fetchApi(`/api/v1/plaid/accounts/${selectedAccount}/transactions`),
    enabled: !!selectedAccount,
    staleTime: 2 * 60 * 1000,
  });

  const handleSync = async (accountId: string) => {
    try {
      await syncAccount(accountId);
      addToast("Synchronisation réussie", "success");
    } catch (err) {
      addToast("Erreur lors de la synchronisation", "error");
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm("Supprimer ce compte et toutes ses transactions ?")) return;
    try {
      await deleteAccount(accountId);
      addToast("Compte supprimé", "success");
      if (selectedAccount === accountId) setSelectedAccount(null);
    } catch (err) {
      addToast("Erreur lors de la suppression", "error");
    }
  };

  if (accountsLoading) {
    return (
      <PageTransition>
        <PageSection>
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </PageSection>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageSection>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-h1" style={{ margin: 0 }}>
              Comptes bancaires
            </h1>
            <p className="text-small text-text-secondary" style={{ marginTop: "8px" }}>
              Gérez vos comptes connectés
            </p>
          </div>
          <PlaidLink />
        </div>

        {!accounts || accounts.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Building2 className="w-12 h-12 mx-auto text-text-muted mb-4 opacity-50" />
              <p className="text-text-tertiary text-lg mb-4">
                Aucun compte connecté
              </p>
              <PlaidLink />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {accounts.map((account) => (
                <Card
                  key={account.id}
                  className={selectedAccount === account.id ? "ring-2 ring-primary" : ""}
                >
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-muted rounded-lg">
                          {account.account_type === "credit" ? (
                            <CreditCard className="w-5 h-5 text-primary" />
                          ) : (
                            <Wallet className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="text-text-primary font-medium">{account.account_name}</p>
                          <p className="text-caption text-text-tertiary">{account.institution_name}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSync(account.id)}
                          disabled={isSyncing}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(account.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-4 h-4 text-loss" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-caption text-text-tertiary">Solde actuel</span>
                        <span className="text-h3 font-tnum">
                          {formatCurrency(account.balance_current, account.currency)}
                        </span>
                      </div>
                      {account.last_synced && (
                        <p className="text-caption text-text-muted mt-2">
                          Dernière sync: {new Date(account.last_synced).toLocaleString("fr-FR")}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="pill"
                      className="w-full mt-3"
                      onClick={() => setSelectedAccount(account.id)}
                    >
                      Voir transactions
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Transactions récentes</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {!selectedAccount ? (
                  <div className="py-12 text-center text-text-tertiary">
                    Sélectionnez un compte pour voir les transactions
                  </div>
                ) : transactionsLoading ? (
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                  </div>
                ) : !transactions || transactions.length === 0 ? (
                  <div className="py-12 text-center text-text-tertiary">
                    Aucune transaction
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-surface border-b border-border">
                        <tr>
                          <th className="text-left px-4 py-2 text-text-tertiary">Date</th>
                          <th className="text-left px-4 py-2 text-text-tertiary">Description</th>
                          <th className="text-right px-4 py-2 text-text-tertiary">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="border-b border-border hover:bg-surface-raised">
                            <td className="px-4 py-3 text-text-secondary">
                              {new Date(tx.date).toLocaleDateString("fr-FR")}
                            </td>
                            <td className="px-4 py-3 text-text-primary">
                              <div>{tx.name}</div>
                              {tx.category && tx.category.length > 0 && (
                                <div className="text-caption text-text-muted">
                                  {tx.category.join(" > ")}
                                </div>
                              )}
                            </td>
                            <td className={`px-4 py-3 text-right font-tnum ${tx.amount >= 0 ? "text-gain" : "text-loss"}`}>
                              {tx.amount >= 0 ? "+" : ""}
                              {formatCurrency(tx.amount, "EUR")}
                              {tx.pending && (
                                <span className="ml-2 text-caption text-amber-500">En attente</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </PageSection>
    </PageTransition>
  );
}
