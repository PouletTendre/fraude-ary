# Frontend Guide

## Project Structure

```
apps/frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   │   ├── login/         # Login page
│   │   └── register/      # Registration page
│   ├── (dashboard)/       # Dashboard route group (protected)
│   │   ├── assets/        # Assets management page
│   │   ├── portfolio/     # Portfolio overview
│   │   ├── journal/       # Transaction journal
│   │   ├── alerts/        # Price alerts
│   │   ├── notifications/ # Notifications center
│   │   ├── settings/      # User settings
│   │   └── layout.tsx     # Dashboard layout with sidebar
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing / redirect page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Toast.tsx
│   │   ├── PageTransition.tsx
│   │   ├── AssetAvatar.tsx
│   │   ├── ChartTooltip.tsx
│   │   ├── KPICard.tsx
│   │   ├── Tag.tsx
│   │   ├── TimeFilterChips.tsx
│   │   ├── Tooltip.tsx
│   │   └── index.ts       # Barrel export
│   ├── Footer.tsx
│   ├── GoalsWidget.tsx
│   ├── MarketWeatherWidget.tsx
│   ├── RecentTransactionsWidget.tsx
│   ├── Sidebar.tsx        # Navigation sidebar
│   ├── MobileNav.tsx      # Mobile navigation
│   ├── SymbolSearch.tsx   # Symbol search with Yahoo API
│   ├── ThemeToggle.tsx    # Dark/light mode toggle
│   └── DonutChart.tsx     # Portfolio allocation chart
├── components/providers/  # Context providers
│   ├── QueryProvider.tsx  # TanStack Query provider
│   └── ThemeProvider.tsx   # Dark mode provider
├── hooks/                 # Custom React hooks
│   ├── useAssets.ts       # Asset CRUD operations
│   ├── useAuth.ts         # Authentication logic
│   ├── usePortfolio.ts    # Portfolio data fetching
│   ├── useSettings.tsx    # User preferences (currency, theme)
│   ├── useNotifications.ts # Notifications management
│   └── useTransactions.ts # Transaction CRUD
├── lib/                   # Utilities
│   ├── api.ts            # API client (fetch wrapper, JWT, 401 redirect, 204 handling)
│   └── utils.ts          # cn(), formatNumber(), formatCurrency()
├── types.ts              # TypeScript interfaces (Asset, Transaction, PortfolioSummary, etc.)
├── next.config.mjs
├── postcss.config.mjs
├── tailwind.config.ts
├── tailwind.theme.json
├── tsconfig.json
└── Dockerfile
```

## Key Components

### SymbolSearch

Real-time symbol search powered by Yahoo Finance. Debounced 300ms, supports international symbols (AIR.PA, SAP.DE), custom symbol fallback.

```tsx
<SymbolSearch
  value={formData.symbol}
  onChange={(symbol) => setFormData({ ...formData, symbol })}
  error={errors.symbol}
  assetType={formData.type}
/>
```

### API Client (`lib/api.ts`)

Centralized fetch wrapper:
- JWT token injection from `localStorage`
- 401 handling → clear token + redirect to `/login`
- 204 No Content → returns `undefined`, does NOT parse JSON
- Error parsing from `detail` field

```typescript
const data = await fetchApi<Asset[]>("/api/v1/assets");
```

### Utility Functions (`lib/utils.ts`)

```typescript
cn(...inputs)                    // Tailwind class merge
formatNumber(value, decimals=2)  // Number to fixed decimal
formatCurrency(value, currency="EUR")  // Value + currency symbol
```

> **Important**: Always use `formatCurrency(value, currency)` for any money display. Never hardcode `$` or any symbol. The function maps currency codes to symbols (USD→$, EUR→€, GBP→£, JPY→¥, CHF→CHF).

## Pages

### /assets
- Add/edit/delete asset forms with symbol search
- Sortable/filterable table with bulk delete
- Asset detail view with price history chart
- CSV import
- Multi-currency support with EUR conversion display

### /portfolio
- Total value and P&L cards (EUR-based)
- Allocation donut + bar charts by type
- Performance area/line chart with time period filtering
- Detailed asset table with P&L% per asset

### /alerts
- Create alerts (target price, condition above/below, currency)
- Active/triggered alert badges
- Delete alerts

### /settings
- Dark/light mode toggle
- Currency selection

## Styling

### Tailwind CSS
Theme tokens in `tailwind.config.ts`. Dark mode via `dark` class strategy.

### Utility Classes Pattern
Always pair light + dark:
```
bg-white dark:bg-gray-800
border-gray-200 dark:border-gray-700
text-gray-900 dark:text-gray-100
```

### Custom Theme Variables
- `--r-md`, `--r-lg` — border radius
- `bg-surface`, `bg-surface-raised`, `bg-surface-sunken` — card backgrounds
- `text-text-primary`, `text-text-secondary`, `text-text-tertiary` — text levels
- `text-gain`, `text-loss` — profit/loss colors
- `bg-gain-muted`, `bg-loss-muted` — profit/loss backgrounds

## State Management

### TanStack Query (React Query)
All server state via TanStack Query v5:
- `useAssets()` — fetch, create, update, delete, bulk delete, dedup
- `useAuth()` — login, register, logout
- `usePortfolio()` — summary, history, statistics
- `useNotifications()` — list, read, read-all
- `useAlerts()` — list, create, update, delete, count
- `useTransactions()` — list, create, update, delete
- `useSettings()` — currency, theme preferences

### Local Storage
- `token` — JWT access token
- `user` — Serialized user object

## Routing

Next.js App Router with route groups:
- `(auth)` — Unauthenticated pages (login, register)
- `(dashboard)` — Authenticated pages with sidebar layout

Root `page.tsx` redirects authenticated users to `/portfolio`, unauthenticated to `/login`.