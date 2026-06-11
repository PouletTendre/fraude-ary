import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";

interface LinkTokenResponse {
  link_token: string;
  expiration: string;
}

interface ExchangeTokenResponse {
  item_id: string;
  accounts_count: number;
}

interface BankAccount {
  id: string;
  institution_name: string;
  account_name: string;
  account_type: string;
  balance_current: number;
  balance_available: number;
  currency: string;
  last_synced: string | null;
}

interface BankTransaction {
  id: string;
  account_id: string;
  date: string;
  amount: number;
  name: string;
  category: string[] | null;
  pending: boolean;
}

export function usePlaid() {
  const queryClient = useQueryClient();

  const { data: accounts, isLoading: accountsLoading } = useQuery<BankAccount[]>({
    queryKey: ["plaid-accounts"],
    queryFn: () => fetchApi("/api/v1/plaid/accounts"),
    staleTime: 5 * 60 * 1000,
  });

  const linkTokenMutation = useMutation<LinkTokenResponse>({
    mutationFn: () => fetchApi("/api/v1/plaid/link-token", { method: "POST" }),
  });

  const exchangeTokenMutation = useMutation<ExchangeTokenResponse, Error, string>({
    mutationFn: (public_token: string) =>
      fetchApi("/api/v1/plaid/exchange-token", {
        method: "POST",
        body: JSON.stringify({ public_token }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plaid-accounts"] });
    },
  });

  const syncMutation = useMutation<void, Error, string>({
    mutationFn: (account_id: string) =>
      fetchApi(`/api/v1/plaid/sync/${account_id}`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plaid-accounts"] });
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (account_id: string) =>
      fetchApi(`/api/v1/plaid/accounts/${account_id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plaid-accounts"] });
    },
  });

  return {
    accounts,
    accountsLoading,
    createLinkToken: linkTokenMutation.mutateAsync,
    exchangeToken: exchangeTokenMutation.mutateAsync,
    syncAccount: syncMutation.mutateAsync,
    deleteAccount: deleteMutation.mutateAsync,
    isCreatingLink: linkTokenMutation.isPending,
    isExchanging: exchangeTokenMutation.isPending,
    isSyncing: syncMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
