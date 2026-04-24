---
name: Fraude-Ary
version: 2.0
description: Premium fintech portfolio tracker — dark-first, data-dense, institutional clarity.
colors:
  # Backgrounds & surfaces
  background: "#0B0D10"
  surface: "#13161B"
  surface-raised: "#1A1E24"
  surface-sunken: "#07080A"
  # Primary actions
  primary: "#6366F1"
  primary-hover: "#818CF8"
  primary-muted: "#312E81"
  primary-subtle: "rgba(99,102,241,0.08)"
  # Secondary & accents
  secondary: "#22D3EE"
  secondary-hover: "#67E8F9"
  secondary-muted: "rgba(34,211,238,0.08)"
  violet: "#A78BFA"           # NEW — sparklines secondaires, highlighting
  violet-muted: "rgba(167,139,250,0.1)"
  # Semantic (strictement réservés)
  gain: "#10B981"             # Renommé depuis "accent" — gains uniquement
  gain-hover: "#34D399"
  gain-muted: "rgba(16,185,129,0.12)"
  loss: "#EF4444"             # Renommé depuis "danger" — pertes uniquement
  loss-hover: "#F87171"
  loss-muted: "rgba(239,68,68,0.12)"
  warning: "#F59E0B"
  warning-hover: "#FBBF24"
  warning-muted: "rgba(245,158,11,0.12)"
  # Textes
  text-primary: "#F8FAFC"
  text-secondary: "#94A3B8"
  text-tertiary: "#64748B"
  text-muted: "#475569"
  text-disabled: "#334155"    # NEW — champs désactivés
  # Bordures
  border: "#1E293B"
  border-hover: "#334155"
  border-focus: "#6366F1"     # NEW — focus ring
  # Charts
  chart-positive: "#10B981"
  chart-negative: "#EF4444"
  chart-neutral: "#64748B"
  chart-secondary: "#22D3EE"
  chart-tertiary: "#A78BFA"   # NEW — 3e série de données
  # Misc
  overlay: "rgba(0,0,0,0.6)"
  skeleton: "#1A1E24"         # NEW — états de chargement
---

## Vue d'ensemble

Fraude-Ary est un tracker de portefeuille self-hosted premium. L'identité visuelle communique la **confiance institutionnelle** et la **clarté des données** — comme un terminal Bloomberg rencontrant un SaaS moderne.

Le design est **dark-first**. L'interface est dense en données : tableaux, chiffres, graphiques et flux temps réel constituent le contenu principal. Chaque décision visuelle sert la lisibilité et la hiérarchie.

---

## Couleurs

### Principe fondamental

**Vert = gain. Rouge = perte. Jamais d'autre usage.**
Ces deux couleurs ont une charge sémantique absolue dans un contexte financier. Les employer pour autre chose (succès/erreur génériques, statuts, icônes) crée une ambiguïté cognitive. Utiliser `primary` pour les actions, `warning` pour les alertes.

### Palette de fond

Construite sur une fondation charbon profond avec l'indigo électrique comme couleur d'action principale.

| Token | Valeur | Rôle |
|---|---|---|
| `background` | `#0B0D10` | Quasi-noir. Fond de page, immersion maximale. |
| `surface` | `#13161B` | Cartes et panneaux. Légèrement au-dessus du fond. |
| `surface-raised` | `#1A1E24` | Hover states, cartes élevées, dropdowns. |
| `surface-sunken` | `#07080A` | Inputs, blocs de code, couches les plus profondes. |

L'élévation se communique par **décalage de couleur de fond**, pas par ombre. Les ombres sont réservées aux modales, dropdowns et tooltips.

### Couleurs d'action et d'accent

| Token | Valeur | Rôle |
|---|---|---|
| `primary` | `#6366F1` | Indigo électrique. **Une seule couleur d'action.** Boutons, états actifs, liens. |
| `secondary` | `#22D3EE` | Cyan. Highlights de données, sparklines, CTAs secondaires. |
| `violet` *(nouveau)* | `#A78BFA` | Violet doux. Troisième série de données sur les charts, highlighting de comparaison. |

### Sémantique financière (usage strict)

| Token | Valeur | Uniquement pour |
|---|---|---|
| `gain` | `#10B981` | Performances positives, gains, profits |
| `loss` | `#EF4444` | Performances négatives, pertes, suppressions |
| `warning` | `#F59E0B` | Alertes, attention, volatilité |

---

## Typographie

Inter est le cheval de bataille — lisible en petite taille, neutre, moderne. JetBrains Mono gère toutes les données numériques pour garantir l'alignement tabulaire.

### Échelle typographique

| Rôle | Taille | Poids | Tracking | Usage |
|---|---|---|---|---|
| `display` | 2.5rem | 700 | −0.02em | Titres de page |
| `h1` | 1.75rem | 600 | −0.01em | Sections majeures |
| `h2` | 1.375rem | 600 | −0.01em | Sous-sections |
| `h3` | 1.125rem | 600 | — | Titres de cartes |
| `body` | 0.9375rem | 400 | — | Contenu principal |
| `body-sm` | 0.875rem | 400 | — | Tableaux, cartes compactes |
| `label` | 0.75rem | 500 | +0.02em | En-têtes de table, badges, axes. **MAJUSCULES.** |
| `mono` | 0.875rem | 400 | — | **Tous les prix, %, quantités.** `font-feature: tnum` obligatoire. |
| `mono-lg` *(nouveau)* | 1.25rem | 600 | −0.02em | Valeurs KPI en grand format |

**Règle absolue :** toute valeur numérique (prix, P&L, allocation, volume) utilise `JetBrains Mono` avec `font-feature-settings: "tnum"`. L'alignement en colonne est non-négociable.

---

## Layout & Espacement

Grille de base 8px avec étapes sémantiques.

| Token | Valeur | Usage |
|---|---|---|
| `xs` | 4px | Padding interne serré, gaps d'icônes |
| `sm` | 8px | Espacement inline, padding de badges |
| `md` | 16px | Padding interne de cartes, gaps de formulaires |
| `lg` | 24px | Gaps de sections, padding sidebar |
| `xl` | 32px | Padding de page |
| `2xl` | 48px | Ruptures majeures de section |
| `3xl` | 64px | Séparateurs hero |

---

## Élévation & Profondeur

Étagée via décalage de couleur, pas d'ombres sur les cartes.

- **Couches de surface :** Background → Surface → Surface Raised. Chaque étape est ~7% plus claire.
- **Ombres :** Usage restreint. `shadow-md` pour les dropdowns. `shadow-lg` pour les modales.
- **Glow :** Halo indigo subtil (`0 0 20px rgba(99,102,241,0.15)`) sur les boutons primaires actifs et les éléments de nav actifs.

---

## Rayons de bordure

| Token | Valeur | Usage |
|---|---|---|
| `none` | 0px | Séparateurs de table internes |
| `sm` | 6px | Tags, micro-éléments |
| `md` | 10px | Boutons, inputs |
| `lg` | 14px | Cartes, panneaux |
| `xl` | 18px | Modales, popovers |
| `full` | 9999px | Badges, pills, avatars |

---

## Composants

### KPI Cards *(nouveau)*

Composant central pour afficher les métriques clés en haut de dashboard.

```
┌─────────────────────────┐
│  VALEUR TOTALE           │  ← label (uppercase, text-tertiary)
│  €84 320                 │  ← mono-lg, text-primary
│  ▲ +2.34% ce mois        │  ← mono, gain / loss selon valeur
└─────────────────────────┘
```

- Background `surface`, border `border`, radius `lg`
- Valeur : `mono-lg` (1.25rem, 600)
- Delta : `mono` avec couleur `gain` ou `loss` selon le signe. **Jamais de couleur neutre pour un delta non-nul.**
- KPIs recommandés : Valeur totale · P&L journalier · Beta · Sharpe ratio · Max drawdown

### Boutons

| Variante | Fond | Texte | Usage |
|---|---|---|---|
| Primary | `primary` | `text-primary` | Actions principales (Ajouter, Sauvegarder) |
| Secondary | `surface-raised` + `border` | `text-primary` | Actions secondaires (Annuler, Filtrer) |
| Ghost | Transparent | `text-secondary` | Actions tertiaires, navigation |
| Danger | `loss` | `text-primary` | Suppressions, actions destructrices |

Tous : `rounded-md` (10px), padding `10px 16px`, `body-sm`.

### Cards

| Variante | Fond | Ombre | Usage |
|---|---|---|---|
| Default | `surface` | — | Contenu standard |
| Elevated | `surface-raised` | `shadow-md` | Modales, panneaux focus |
| Sunken | `surface-sunken` | — | Sections de code, zone de chart |

**Ne jamais utiliser d'ombre sur les cartes standard** — la différence de couleur de fond suffit.

### Inputs

- Fond `surface-sunken`, border `border`, radius `md`
- Focus : border `primary` + ring `0 0 0 3px rgba(99,102,241,0.2)`
- Placeholder : `text-muted`
- Erreur : border `loss` + ring loss/20%

### Badges

Fonds teintés légers avec texte solide. Format `label` (uppercase, 0.75rem, tracking +0.02em).

| Type | Fond | Texte | Usage |
|---|---|---|---|
| Gain | `gain-muted` | `gain` | Performances positives |
| Loss | `loss-muted` | `loss` | Performances négatives |
| Warning | `warning-muted` | `warning` | Alertes, volatilité |
| Info | `primary-subtle` | `primary-hover` | Statuts neutres, en cours |
| Neutral | rgba(100,116,139,0.12) | `text-secondary` | Clôturé, inactif |

### Chips de filtre temporel *(nouveau)*

Sélecteur de période (1J / 1S / 1M / 3M / YTD / 1A / Tout).

- Inactif : `surface-raised` + border `border`, texte `text-secondary`
- Actif : fond `primary-subtle`, border `rgba(99,102,241,0.3)`, texte `primary-hover`
- Radius : `full`
- Disposition : rangée horizontale, gap `sm`

### Tables

| Élément | Style |
|---|---|
| En-tête | Fond `surface-sunken`, texte `label` (uppercase, `text-tertiary`), border-bottom `border` |
| Ligne | Fond transparent, border-bottom `border` |
| Ligne hover | Fond `surface-raised` |
| Cellule numérique | `mono`, `tnum`, alignement droit |
| Colonne allocation | Progress bar inline (hauteur 6px, radius `full`, dégradé `primary → secondary`) |

Pas de radius externe. Les tableaux ont des angles droits.

### Sidebar

- Fond `surface-sunken`, border-right `border`, largeur 260px fixe
- Item inactif : texte `text-secondary`
- Item actif : texte `primary-hover`, fond `primary-subtle`, border-left 2px solid `primary`
- Badges de notification : `badge loss` pour erreurs, `badge warning` pour alertes, flottant à droite

### Avatars d'actifs *(nouveau)*

Cercle 32–40px pour identifier visuellement chaque actif dans les tables.

- Couleur calquée sur la catégorie : Equity = indigo, Crypto = cyan, ETF = violet, Matière première = amber
- Fond : couleur à 15% d'opacité, border : couleur à 30%, texte : couleur solide
- 2 initiales en `label` (500)

### Tooltips de chart

- Fond `surface-raised`, border `border`, radius `md`, ombre `shadow-lg`
- Ligne 1 : ticker + timestamp en `label`, `text-tertiary`
- Ligne 2 : prix en `mono` 15px/500, `text-primary`
- Ligne 3 : delta en `mono` 11px, `gain` ou `loss`

### Progress bars d'allocation *(nouveau)*

- Track : `border` (1E293B), hauteur 6px, radius `full`
- Fill : dégradé `primary → secondary`, radius `full`
- Toujours accompagné du % en `mono` 11px `text-tertiary` à droite

### Tags / Étiquettes *(nouveau)*

Métadonnées libres associées aux actifs (secteur, indice, stratégie).

- Fond `surface-raised`, border `border`, radius `sm`, texte `text-secondary` 11px
- Ne pas utiliser de couleurs sémantiques pour les tags — réservé aux badges

### Skeleton loaders *(nouveau)*

Pour les états de chargement des données temps réel.

- Fond `skeleton` (#1A1E24), radius identique à l'élément remplacé
- Animation : `opacity` pulsée entre 0.4 et 1.0, durée 1.4s ease-in-out, infinie
- Dimensions : identiques à l'élément final pour éviter le layout shift

---

## Règles Do / Don't

### ✅ Do

- Utiliser `mono` + `tnum` pour **toutes** les valeurs numériques sans exception.
- Maintenir un contraste élevé : `text-primary` sur fond `surface` est toujours lisible.
- Respecter la grille 8px pour l'espacement.
- Réserver le vert exclusivement aux gains / succès.
- Réserver le rouge exclusivement aux pertes / erreurs.
- Utiliser `violet` comme troisième couleur de série sur les charts à données multiples.
- Ajouter un état skeleton avant tout chargement de données.
- Afficher des chips de filtre temporel sur tous les graphiques.

### ❌ Don't

- Ne jamais utiliser d'ombres sur les cartes ou panneaux — s'appuyer sur les décalages de couleur.
- Ne jamais mélanger plus d'une couleur d'accent dans le même contexte.
- Ne jamais utiliser le rouge ou le vert pour un usage non-financier (validation de form, succès d'upload…).
- Ne jamais hardcoder de couleurs en dehors des tokens.
- Ne jamais afficher un nombre brut sans formatage (`tnum`, séparateurs de milliers, symbole de devise).
- Ne jamais tronquer un prix — afficher toujours les décimales pertinentes.
- Ne jamais laisser un état de chargement vide — toujours un skeleton.

---

## Notes d'implémentation

### Formatage des nombres

Toujours formatter côté client avec `Intl.NumberFormat` :
```js
// Prix
new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(84320.48)
// → "84 320,48 €"

// Pourcentage
new Intl.NumberFormat('fr-FR', { style: 'percent', minimumFractionDigits: 2 }).format(0.0234)
// → "2,34 %"

// Ratio (Sharpe, Beta)
new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(1.62)
// → "1,62"
```

### Animations

- Transitions de hover : `150ms ease-out` (boutons, lignes de table)
- Transitions d'état actif (nav, chips) : `200ms ease-in-out`
- Apparition de tooltip : `100ms ease-out`
- Skeleton pulse : `1.4s ease-in-out infinite`
- Pas d'animation sur les valeurs numériques en temps réel — le flashage est contre-productif

### Icônes

Utiliser une bibliothèque cohérente (Lucide ou Phosphor). Taille standard : 16px dans les éléments inline, 20px dans les boutons, 24px dans la navigation.