# Cahier de Tests — Fraude-Ary v2.0

> **Date:** 2026-04-24
> **Scope:** Full-stack QA audit — Backend + Frontend + E2E
> **Objectif:** 100% des scénarios marqués "Fonctionnel"

---

## Module 1: Authentification

| ID | Scénario | Étapes | Critère de succès | Priorité | Statut |
|---|---|---|---|---|---|
| AUTH-01 | Inscription avec email valide | 1. Aller sur /register<br>2. Remplir full_name, email, password<br>3. Soumettre | Compte créé, token JWT retourné, auto-login | P0 | ✅ |
| AUTH-02 | Inscription avec email déjà utilisé | 1. Créer un compte<br>2. Réessayer avec même email | Message d'erreur clair "Email already registered" | P0 | ⏳ |
| AUTH-03 | Connexion avec identifiants valides | 1. Aller sur /login<br>2. Remplir email + password<br>3. Soumettre | Token JWT stocké, redirection vers /portfolio | P0 | ✅ |
| AUTH-04 | Connexion avec mauvais mot de passe | 1. Aller sur /login<br>2. Email valide, password faux | Message "Invalid credentials", pas de token | P0 | ✅ |
| AUTH-05 | Token expiré (24h) | 1. Attendre 24h OU modifier token<br>2. Rafraîchir page protégée | Redirection vers /login, token nettoyé | P1 | ⏳ |
| AUTH-06 | Récupération de profil (/auth/me) | 1. Se connecter<br>2. Appeler GET /auth/me | Retourne {email, full_name} | P1 | ✅ |
| AUTH-07 | Protection des routes | 1. Se déconnecter<br>2. Accéder directement à /portfolio | Redirection vers /login | P0 | ✅ |

---

## Module 2: Assets (Actifs)

| ID | Scénario | Étapes | Critère de succès | Priorité | Statut |
|---|---|---|---|---|---|
| AST-01 | Créer un actif crypto | POST /api/v1/assets avec type=crypto, symbol=BTC | Asset créé, prix live récupéré, transaction BUY auto-créée | P0 | ✅ |
| AST-02 | Créer un actif stock | POST avec type=stocks, symbol=AAPL | Asset créé, prix Yahoo Finance récupéré | P0 | ✅ |
| AST-03 | Créer un actif stock avec point (AIR.PA) | POST avec symbol=AIR.PA | Symbole accepté, prix récupéré | P0 | ✅ |
| AST-04 | Créer un actif en EUR | POST avec currency=EUR | Currency="EUR" dans response, symbole € affiché | P0 | ✅ |
| AST-05 | Créer un actif immobilier | POST avec type=real_estate, symbol=paris | Prix fixe récupéré (12500 EUR/m²) | P0 | ✅ |
| AST-06 | Fusion PRU — 2 achats même symbole | Créer 2 assets MSFT séparément | Un seul asset avec qty=total, PRU=moyenne pondérée | P0 | ✅ |
| AST-07 | Éditer un actif | Clic "Edit" sur ligne asset, modifier qty/prix/devise | Asset mis à jour via `updateAsset` | P1 | ✅ |
| AST-08 | Supprimer un actif | DELETE /api/v1/assets/{id} | Asset supprimé, transactions associées supprimées | P0 | ✅ |
| AST-09 | Suppression en masse | Sélectionner 2+ assets, bulk-delete | Assets supprimés, 204 retourné | P1 | ✅ |
| AST-10 | Recherche de symboles | GET /api/v1/assets/search/symbols?q=AAPL | Résultats Yahoo Finance retournés | P0 | ✅ |
| AST-11 | Backfill historique | POST /api/v1/assets/{id}/backfill-history | Prix historiques insérés dans PriceHistory | P1 | ✅ |
| AST-12 | Dédoublonnage | POST /api/v1/assets/dedup | Doublons fusionnés, PRU recalculé | P2 | ✅ |
| AST-13 | Import CSV | POST /api/v1/assets/import avec fichier CSV | Assets créés, validation colonnes | P1 | ✅ |
| AST-14 | Détails asset — historique prix réel | Ouvrir détail d'un asset | Graphique avec données réelles depuis `/api/v1/assets/{id}/history` | P0 | ✅ |
| AST-15 | Rafraîchissement des prix | POST /api/v1/assets/refresh-prices | Prix mis à jour pour tous les assets | P0 | ✅ |

---

## Module 3: Transactions (Journal)

| ID | Scénario | Étapes | Critère de succès | Priorité | Statut |
|---|---|---|---|---|---|
| TX-01 | Liste des transactions | GET /api/v1/transactions | Liste retournée avec tous les champs | P0 | ✅ |
| TX-02 | Créer une transaction BUY | Bouton "+ Add Transaction" sur /journal, remplir formulaire | Transaction créée, asset mis à jour (qty+, PRU recalculé) | P0 | ✅ |
| TX-03 | Créer une transaction BUY avec taux historique | POST avec currency=USD, date=2023-01-15 | exchange_rate = taux historique Frankfurter à cette date | P0 | ✅ |
| TX-04 | Créer une transaction SELL | Bouton "+ Add Transaction", type=SELL | Asset qty diminuée, si qty=0 asset supprimé | P0 | ✅ |
| TX-05 | Éditer une transaction inline | Crayon sur ligne journal, modifier qty | Transaction mise à jour, asset recalculé | P1 | ✅ |
| TX-06 | Supprimer une transaction | Poubelle sur ligne journal | Transaction supprimée, asset recalculé | P1 | ✅ |
| TX-07 | Transaction BUY crée nouvel asset | Si symbole inexistant | Asset créé avec prix live | P0 | ✅ |
| TX-08 | Transaction BUY fusionne asset existant | Si symbole existe déjà | Qty augmentée, PRU recalculé | P0 | ✅ |
| TX-09 | Taux de change à la date | transaction.total_invested en EUR | Utilise taux historique, pas taux du jour | P1 | ✅ |

---

## Module 4: Portfolio

| ID | Scénario | Étapes | Critère de succès | Priorité | Statut |
|---|---|---|---|---|---|
| PTF-01 | Valeur totale du portfolio | GET /api/v1/portfolio/summary | total_value retourné, converti en EUR base | P0 | ✅ |
| PTF-02 | Gain/Perte total | Portfolio summary | total_gain_loss calculé depuis purchase_price_eur | P0 | ✅ |
| PTF-03 | Performance en % | Portfolio summary | gain_loss_percentage = (value - cost) / cost | P0 | ✅ |
| PTF-04 | Répartition par type | Portfolio summary | by_type avec crypto/stocks/real_estate + % | P0 | ✅ |
| PTF-05 | Historique d'évolution | Portfolio summary → history | Array {date, value, performance} avec données | P0 | ✅ |
| PTF-06 | Historique depuis date d'achat la plus ancienne | History start date | Débute à la plus ancienne purchase_date | P1 | ✅ |
| PTF-07 | Filtres période (1D, 1W, 1M, 3M, 1Y, ALL) | Sélectionner ALL | Affiche toute l'historique disponible | P1 | ✅ |
| PTF-08 | Graphique valeur + performance | Toggle Valeur/Performance | Les deux vues affichent correctement | P1 | ✅ |
| PTF-09 | Export CSV | GET /api/v1/portfolio/export?format=csv | Fichier CSV téléchargé | P1 | ✅ |
| PTF-10 | Export JSON | GET /api/v1/portfolio/export?format=json | Fichier JSON téléchargé | P1 | ✅ |
| PTF-11 | Statistiques (Sharpe, Beta, etc.) | GET /api/v1/portfolio/statistics | best/worst asset, volatility, Sharpe ratio | P2 | ✅ |
| PTF-12 | Comparaison benchmark | GET /api/v1/portfolio/benchmark | Alpha/Beta vs SPY | P2 | ✅ |
| PTF-13 | Conversion multi-devises | Asset USD + Asset EUR | Total en EUR = somme(converti au taux du jour) | P0 | ✅ |
| PTF-14 | Coût de base en EUR | PRU_EUR | purchase_price_eur utilisé pour gain/loss | P0 | ✅ |

---

## Module 5: Alertes

| ID | Scénario | Étapes | Critère de succès | Priorité | Statut |
|---|---|---|---|---|---|
| ALT-01 | Créer une alerte | POST /api/v1/alerts | Alerte créée avec symbol, target_price, condition | P1 | ✅ |
| ALT-02 | Liste des alertes | GET /api/v1/alerts | Liste retournée | P1 | ✅ |
| ALT-03 | Activer/Désactiver une alerte | Toggle sur une alerte | PUT /api/v1/alerts/{id} appelé, is_active inversé | P1 | ✅ |
| ALT-04 | Supprimer une alerte | DELETE /api/v1/alerts/{id} | Alerte supprimée | P1 | ✅ |
| ALT-05 | Symbole avec point accepté | Créer alerte AIR.PA | Regex `^[A-Z0-9.\-]{1,20}$` accepte le point | P1 | ✅ |
| ALT-06 | Devise correcte | Alerte sur asset EUR | Prix affiché avec €, pas $ | P2 | ❌ (Bug #14) |

---

## Module 6: Notifications

| ID | Scénario | Étapes | Critère de succès | Priorité | Statut |
|---|---|---|---|---|---|
| NOT-01 | Liste des notifications | GET /api/v1/notifications | Liste affichée sans erreur | P1 | ✅ |
| NOT-02 | Marquer comme lue | PUT /api/v1/notifications/{id}/read | is_read=true | P1 | ✅ |
| NOT-03 | Marquer tout comme lu | "Mark all as read" | POST /api/v1/notifications/read-all appelé | P1 | ✅ |
| NOT-04 | Affichage correct des champs | Backend retourne title/type/read | Frontend affiche title/type/read sans crash | P1 | ✅ |
| NOT-05 | Lien dans la sidebar | /notifications accessible | Entrée "Notifications" dans la sidebar avec badge unread | P2 | ✅ |

---

## Module 7: UI/UX Global

| ID | Scénario | Étapes | Critère de succès | Priorité | Statut |
|---|---|---|---|---|---|
| UI-01 | Dark mode | Toggle dark/light | Tous les composants basculent correctement | P1 | ✅ |
| UI-02 | Responsive mobile | Réduire viewport < 768px | Sidebar collapse ou menu hamburger | P1 | ❌ (Bug #12) |
| UI-03 | Badge alertes dynamique | Ajouter/supprimer alerte | Badge sidebar mis à jour | P2 | ❌ (Bug #10) |
| UI-04 | Format de devise | Asset USD → $, EUR → € | Symbole correct par asset | P0 | ✅ |
| UI-05 | Format de devise GBP/JPY/CHF | Créer asset GBP/JPY/CHF | Symbole £/¥/CHF affiché | P2 | ✅ |
| UI-06 | Page d'accueil marketing | / | Contenu marketing ou redirection | P3 | ⏳ |
| UI-07 | Formulaire ajout transaction | /journal | Bouton "+ Add Transaction" avec formulaire inline | P1 | ✅ |
| UI-08 | Formulaire édition asset | /assets | Bouton "Edit" avec formulaire inline | P2 | ✅ |

---

## Module 8: Intégrité Données

| ID | Scénario | Étapes | Critère de succès | Priorité | Statut |
|---|---|---|---|---|---|
| DB-01 | Clés étrangères | Supprimer un asset avec transactions | Transactions liées supprimées en cascade | P1 | ✅ (logique applicative) |
| DB-02 | Orphelins | Asset sans transactions | Pas de crash | P1 | ✅ |
| DB-03 | Cache Redis | Appeler /api/v1/cache/stats | Stats Redis retournées | P2 | ✅ |
| DB-04 | Vidage cache | POST /api/v1/cache/clear | Cache vidé | P2 | ✅ |
| DB-05 | Rate limiting | Appeler /rate-limit-test >100x/min | 429 Too Many Requests | P2 | ✅ |

---

## Récapitulatif Global

| Statut | Compteur | % |
|---|---|---|
| ✅ Fonctionnel | 58 | 85.3% |
| ❌ Non fonctionnel / Bug | 4 | 5.9% |
| ⏳ Non testé / Hors scope | 6 | 8.8% |
| **Total** | **68** | **100%** |

### Bugs restants (Priorité P1/P2)
1. **UI-02** — Responsive mobile (sidebar fixe 260px, pas de hamburger) — P1
2. **UI-03** — Badge alertes sidebar hardcodé à "3" au lieu de dynamique — P2
3. **ALT-06** — Alerts page hardcode `$` pour target price — P2
4. **AUTH-02** — Inscription email déjà utilisé (pas de test E2E) — P0 ⏳

### Hors scope (P3)
- Bank account sync, Dividend tracking, Tax reporting, Multi-user sharing, WebSocket live prices, Password recovery, Push notifications
