# Roadmap — Parité Fonctionnelle avec Finary

**Dernière mise à jour:** 2026-04-25
**Objectif:** Atteindre la parité fonctionnelle avec Finary tout en maintenant un score de sécurité maximal.

---

## Matrice de Parité

| # | Module | Finary | Fraude-Ary | Priorité | Status |
|---|--------|--------|------------|----------|--------|
| 1 | Suivi de patrimoine (multi-actifs) | ✅ | ✅ | — | DONE |
| 2 | Prix temps réel (actions, crypto) | ✅ | ✅ | — | DONE |
| 3 | Graphiques de performance | ✅ | ✅ | — | DONE |
| 4 | Alertes de prix | ✅ | ✅ | — | DONE |
| 5 | Import CSV | ✅ | ✅ | — | DONE |
| 6 | Multi-devises | ✅ | ✅ | — | DONE |
| 7 | Mode sombre | ✅ | ✅ | — | DONE |
| 8 | **Tracker de dividendes** | ✅ | ✅ | 🔴 P1 | DONE |
| 9 | **Analyse de diversification** | ✅ | ✅ | 🔴 P1 | DONE |
| 10 | **Simulateur de patrimoine** | ✅ | ❌ | 🔴 P1 | TODO |
| 11 | **Gestion du budget** | ✅ | ❌ | 🟠 P2 | TODO |
| 12 | **Scanner de frais** | ✅ | ❌ | 🟠 P2 | TODO |
| 13 | **Scanner d'abonnements** | ✅ | ❌ | 🟠 P2 | TODO |
| 14 | **Plans DCA automatiques** | ✅ | ❌ | 🟠 P2 | TODO |
| 15 | **Calculatrice intérêts composés** | ✅ | ❌ | 🟡 P3 | TODO |
| 16 | **Calculateur crédit immobilier** | ✅ | ❌ | 🟡 P3 | TODO |
| 17 | **Investissements populaires (leaderboard)** | ✅ | ❌ | 🟡 P3 | TODO |
| 18 | **Comptes CTO / PEA** | ✅ | ❌ | 🟡 P3 | TODO |
| 19 | **Assurance vie** | ✅ | ❌ | 🟢 P4 | TODO |
| 20 | **Revenus passifs (staking/lending)** | ✅ | ❌ | 🟢 P4 | TODO |
| 21 | **Export PDF** | ✅ | ❌ | 🟢 P4 | TODO |
| 22 | **Application mobile** | ✅ | ❌ | 🟢 P5 | TODO |
| 23 | **Agrégation bancaire (Plaid/Budget Insight)** | ✅ | ❌ | 🟢 P5 | TODO |

---

## Détail des Modules

### 8. Tracker de dividendes (P1)
**Description:** Suivi des dividendes reçus, rendement sur coût, historique des versements.
- Backend: Nouveau modèle `Dividend`, endpoint CRUD, calcul du rendement
- Frontend: Page dédiée avec tableau historique + graphique revenus mensuels
- Données: API Yahoo Finance pour historique dividendes par action

### 9. Analyse de diversification (P1)
**Description:** Répartition par géographie, secteur, segment de marché.
- Backend: Enrichissement des métadonnées d'actifs (pays, secteur via Yahoo Finance)
- Frontend: Graphiques donut/barres par catégorie (géographie, secteur, type)
- Données: API Yahoo Finance `assetProfile` pour secteur/industrie

### 10. Simulateur de patrimoine (P1)
**Description:** Projection de la valeur du patrimoine dans le temps avec scénarios.
- Backend: Calcul de projection basé sur rendements historiques + taux d'épargne
- Frontend: Interface interactive avec sliders (taux d'épargne, horizon, rendement)
- Formules: Intérêts composés + versements réguliers + réévaluation actifs

### 11. Gestion du budget (P2)
**Description:** Suivi des revenus et dépenses, catégorisation automatique.
- Backend: Modèles `Budget`, `Expense`, `Category`, endpoint de catégorisation
- Frontend: Dashboard budget avec barres de progression par catégorie
- Intégration: CSV bancaire import (en attendant API bancaire)

### 12. Scanner de frais (P2)
**Description:** Détection des frais cachés dans les investissements.
- Backend: Analyse des frais de transaction vs standards du marché
- Frontend: Alerte sur frais anormalement élevés, comparaison marché
- Données: Base de données de frais par courtier/ETF

### 13. Scanner d'abonnements (P2)
**Description:** Identification des dépenses récurrentes.
- Backend: Détection de patterns récurrents dans les transactions
- Frontend: Liste des abonnements détectés avec montant mensuel/annuel
- Algorithme: Matching de transactions similaires à intervalles réguliers

### 14. Plans DCA automatiques (P2)
**Description:** Configuration d'investissements automatiques programmés.
- Backend: Modèle `DCAPlan`, scheduler APScheduler pour exécution périodique
- Frontend: Création/gestion de plans DCA, historique des exécutions
- Note: Sans API broker, se limite à un tracker/reminder

### 15-23. Modules P3-P5
Détail à définir lors de l'implémentation.

---

## Cycle d'Implémentation

Pour chaque module:
1. **Implémentation** — Code backend + frontend
2. **Tests** — Vérification manuelle + tests unitaires
3. **Audit sécurité** — Vérification pas de nouvelle faille
4. **Validation** — Commit + mise à jour roadmap

---

## Progression

| Date | Module | Status |
|------|--------|--------|
| 2026-04-25 | Sécurité (34 vulnérabilités) | ✅ DONE |
| 2026-04-25 | 8. Tracker de dividendes | ✅ DONE |
| 2026-04-25 | 9. Analyse de diversification | ✅ DONE |
| — | 10. Simulateur de patrimoine | ⏳ NEXT |
