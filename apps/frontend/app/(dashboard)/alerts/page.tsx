"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { PageTransition } from "@/components/ui/PageTransition";
import { PageSection } from "@/components/ui/PageSection";
import { useAlerts, type CreateAlertData } from "@/hooks/useAlerts";
import { useToast } from "@/components/ui/Toast";
import { useSettings } from "@/hooks/useSettings";
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PriceAlert } from "@/types";

function AlertCard({ alert, onToggle, onDelete, isToggling, isDeleting }: {
  alert: PriceAlert;
  onToggle: (id: string, is_active: boolean) => void;
  onDelete: (id: string) => void;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  const { formatCurrency } = useSettings();
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border bg-surface border-border transition-colors hover:border-border-hover">
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
        alert.condition === "above" ? "bg-gain-muted/30" : "bg-loss-muted/30"
      )}>
        {alert.condition === "above" ? (
          <TrendingUp className="w-5 h-5 text-gain" />
        ) : (
          <TrendingDown className="w-5 h-5 text-loss" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="w-590 text-text-primary">
                {alert.symbol}
              </p>
              <Badge variant={alert.is_active ? "success" : "neutral"}>
                {alert.is_active ? "Active" : "Inactive"}
              </Badge>
              {alert.triggered_at && (
                <Badge variant="neutral">Déclenchée</Badge>
              )}
            </div>
            <p className="text-small text-text-tertiary mt-1">
              Alerte quand le prix passe{" "}
              <span className={cn(
                "font-medium",
                alert.condition === "above" ? "text-gain" : "text-loss"
              )}>
                {alert.condition}
              </span>{" "}
              {formatCurrency(alert.target_price, alert.currency || "EUR")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <p className="text-caption text-text-muted">
            Créée le {new Date(alert.created_at).toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onToggle(alert.id, !alert.is_active)}
          disabled={isToggling}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-text-secondary focus:ring-offset-2 disabled:opacity-50",
            alert.is_active ? "bg-surface-raised" : "bg-surface-sunken"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-surface transition-transform",
              alert.is_active ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
        <button
          onClick={() => onDelete(alert.id)}
          disabled={isDeleting}
          className="p-2 rounded-lg text-text-muted hover:text-loss hover:bg-loss-muted transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const { alerts, isLoading, createAlert, toggleAlert, deleteAlert, isCreating, isToggling, isDeleting } = useAlerts();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateAlertData>({
    symbol: "",
    target_price: 0,
    condition: "above",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.symbol.trim()) {
      newErrors.symbol = "Symbole requis";
    } else if (!/^[A-Z0-9.\-]{1,20}$/.test(formData.symbol.toUpperCase())) {
      newErrors.symbol = "Symbole : 1-20 caractères (lettres, chiffres, points, tirets)";
    }
    if (!formData.target_price || formData.target_price <= 0) {
      newErrors.target_price = "Prix cible valide requis (supérieur à 0)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const data = {
        symbol: formData.symbol.toUpperCase(),
        target_price: Number(formData.target_price),
        condition: formData.condition,
      };
      createAlert(data, {
        onSuccess: () => {
          addToast("Alerte créée avec succès !", "success");
          setFormData({ symbol: "", target_price: 0, condition: "above" });
          setShowForm(false);
        },
        onError: (error: unknown) => {
          const msg = error instanceof Error ? error.message : "Failed to create alert";
          addToast(msg, "error");
        },
      });
    }
  };

  const handleToggle = (id: string, is_active: boolean) => {
    toggleAlert({ id, is_active }, {
      onSuccess: () => addToast(is_active ? "Alerte activée" : "Alerte désactivée", "success"),
      onError: () => addToast("Échec de la mise à jour de l'alerte", "error"),
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette alerte ?")) {
      deleteAlert(id, {
      onSuccess: () => addToast("Alerte supprimée", "success"),
      onError: () => addToast("Échec de la suppression de l'alerte", "error"),
      });
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <PageSection>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </PageSection>
        <PageSection>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        </PageSection>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageSection>
        <h1 className="text-h1" style={{ margin: 0 }}>
          Alertes de Prix
        </h1>
        <p className="text-small text-text-secondary" style={{ marginTop: "8px" }}>
          Alertes de prix configurées
        </p>
      </PageSection>

      <PageSection>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-text-tertiary">
              {alerts.length > 0 ? (
                <span>
                  Vous avez <span className="font-medium text-primary">{alerts.filter(a => a.is_active).length}</span> alerte{alerts.filter(a => a.is_active).length !== 1 ? "s" : ""} active{alerts.filter(a => a.is_active).length !== 1 ? "s" : ""}
                </span>
              ) : (
                "Créez des alertes pour être notifié quand les prix atteignent vos objectifs."
              )}
            </p>
            <Button onClick={() => setShowForm(!showForm)} disabled={isCreating}>
              {showForm ? (
                <>
                  <X className="w-4 h-4 mr-2" /> Annuler
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" /> Nouvelle Alerte
                </>
              )}
            </Button>
          </div>

          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  Créer une Nouvelle Alerte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="Symbole"
                      placeholder="ex: BTC, AAPL"
                      value={formData.symbol}
                      onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                      error={errors.symbol}
                    />
                    <Input
                      label="Prix Cible"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={formData.target_price || ""}
                      onChange={(e) => setFormData({ ...formData, target_price: parseFloat(e.target.value) })}
                      error={errors.target_price}
                    />
                    <div>
                      <label className="block text-caption-lg text-text-secondary mb-1">
                        Condition
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, condition: "above" })}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 h-10 px-3 rounded-lg border text-caption-lg font-medium transition-colors",
                            formData.condition === "above"
                              ? "border-green-500 bg-gain-muted text-gain"
                              : "border-border text-text-secondary hover:bg-surface-raised"
                          )}
                        >
                          <TrendingUp className="w-4 h-4" />
                          Au-dessus
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, condition: "below" })}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 h-10 px-3 rounded-lg border text-caption-lg font-medium transition-colors",
                            formData.condition === "below"
                              ? "border-loss bg-loss-muted text-loss"
                              : "border-border text-text-secondary hover:bg-surface-raised"
                          )}
                        >
                          <TrendingDown className="w-4 h-4" />
                          En-dessous
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? "Création..." : "Créer l'Alerte"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  isToggling={isToggling}
                  isDeleting={isDeleting}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Bell className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-tertiary text-lg font-medium">Aucune alerte</p>
                <p className="text-caption text-text-muted mt-1">
                  Créez votre première alerte de prix pour être notifié quand un actif atteint votre prix cible.
                </p>
                <Button onClick={() => setShowForm(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une Alerte
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </PageSection>
    </PageTransition>
  );
}
