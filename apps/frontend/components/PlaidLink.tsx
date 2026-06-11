"use client";

import { useState, useEffect } from "react";
import { usePlaid } from "@/hooks/usePlaid";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Link2 } from "lucide-react";

declare global {
  interface Window {
    Plaid: any;
  }
}

export function PlaidLink() {
  const { createLinkToken, exchangeToken, isCreatingLink, isExchanging } = usePlaid();
  const { addToast } = useToast();
  const [plaidHandler, setPlaidHandler] = useState<any>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleConnect = async () => {
    try {
      const { link_token } = await createLinkToken();

      const handler = window.Plaid.create({
        token: link_token,
        onSuccess: async (public_token: string) => {
          try {
            await exchangeToken(public_token);
            addToast("Compte bancaire connecté avec succès", "success");
          } catch (err) {
            addToast("Erreur lors de la connexion du compte", "error");
          }
        },
        onExit: (err: any) => {
          if (err) {
            addToast("Connexion annulée", "info");
          }
        },
      });

      setPlaidHandler(handler);
      handler.open();
    } catch (err) {
      addToast("Impossible d'initialiser Plaid", "error");
    }
  };

  return (
    <Button onClick={handleConnect} disabled={isCreatingLink || isExchanging}>
      <Link2 className="w-4 h-4 mr-2" />
      {isCreatingLink || isExchanging ? "Connexion..." : "Connecter un compte"}
    </Button>
  );
}
