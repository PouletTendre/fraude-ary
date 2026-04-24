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
│   │   ├── alerts/        # Price alerts
│   │   ├── notifications/ # Notifications center
│   │   ├── settings/      # User settings
│   │   └── layout.tsx     # Dashboard layout with sidebar
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing / redirect page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Toast.tsx
│   │   └── PageTransition.tsx
│   ├── Sidebar.tsx        # Navigation sidebar
│   ├── MobileNav.tsx      # Mobile navigation
│   ├── SymbolSearch.tsx   # Symbol search with Yahoo API
│   ├── ThemeToggle.tsx    # Dark/light mode toggle
│   └── DonutChart.tsx     # Portfolio allocation chart
├── hooks/                 # Custom React hooks
│   ├── useAssets.ts       # Asset CRUD operations
│   ├── useAuth.ts         # Authentication logic
│   ├── usePortfolio.ts    # Portfolio data fetching
│   ├── useSettings.ts     # User preferences
│   └── useNotifications.ts # Notifications management
├── lib/                   # Utilities
│   ├── api.ts            # API client (fetch wrapper)
│   └── utils.ts          # Helper functions
├── types.ts              # TypeScript interfaces
└── next.config.js        # Next.js configuration
```

## Key Components

### SymbolSearch

The `SymbolSearch` component provides real-time symbol search powered by Yahoo Finance.

**Features:**
- Debounced search (300ms)
- Real-time results from Yahoo Finance API
- Supports international symbols (e.g., `AIR.PA`, `SAP.DE`)
- Custom symbol fallback (type any symbol manually)
- Loading spinner during API calls

**Usage:**
```tsx
<SymbolSearch
  value={formData.symbol}
  onChange={(symbol) => setFormData({ ...formData, symbol })}
  error={errors.symbol}
  assetType={formData.type}
/>
```

### API Client (`lib/api.ts`)

Centralized fetch wrapper with:
- Automatic JWT token injection
- 401 handling (redirect to login)
- JSON parsing with error handling
- Empty body handling for 204 responses

```typescript
const data = await fetchApi<Asset[]>('/api/v1/assets');
```

## Pages

### /assets
Full asset management page with:
- Add new asset form with symbol search
- Sortable/filterable asset table
- Asset detail view with price history chart
- Delete confirmation
- CSV import capability

### /portfolio
Portfolio dashboard with:
- Total value and P&L cards
- Allocation donut chart by asset type
- Performance area chart over time
- Top gainers/losers list

### /alerts
Price alert management:
- Create alerts with target price and condition (above/below)
- List active and triggered alerts
- Delete alerts

### /settings
User preferences:
- Dark/light mode toggle
- Currency selection (USD, EUR, GBP, JPY, CHF)
- Date format preference
- Account management

## Styling

### Tailwind CSS Configuration

Colors and theme tokens are configured in `tailwind.config.ts`. The app supports dark mode via the `dark` class strategy.

### Utility Classes

Common patterns:
```
bg-white dark:bg-gray-800
border-gray-200 dark:border-gray-700
text-gray-900 dark:text-gray-100
hover:bg-gray-100 dark:hover:bg-gray-700
```

## State Management

### TanStack Query (React Query)

All server state is managed via TanStack Query:
- `useAssets()` — fetches, creates, updates, deletes assets
- `useAuth()` — login, register, logout
- `usePortfolio()` — portfolio summary and statistics
- `useNotifications()` — notifications CRUD

### Local Storage

- `token` — JWT access token
- `user` — Serialized user object
- `settings` — User preferences (theme, currency, date format)

## Routing

Next.js App Router with route groups:
- `(auth)` — Unauthenticated pages (login, register)
- `(dashboard)` — Authenticated pages with sidebar layout

The root `page.tsx` redirects authenticated users to `/portfolio` and unauthenticated users to `/login`.
