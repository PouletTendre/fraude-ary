# Architecture

## System Overview

```
                    Internet
                       |
                 ┌─────┴─────┐
                 │   Nginx   │  Port 80
                 │  (Proxy)  │
                 └─────┬─────┘
                       |
         ┌─────────────┼─────────────┐
         |             |             |
    ┌────┴────┐   ┌────┴────┐   ┌────┴────┐
    │Frontend │   │Backend  │   │Backend  │
    │Next.js  │   │FastAPI  │   │FastAPI  │
    │Port 3000│   │Port 8000│   │Port 8000│
    └─────────┘   └────┬────┘   └─────────┘
                       |
              ┌────────┴────────┐
              |                 |
         ┌────┴────┐       ┌────┴────┐
         │  Redis  │       │PostgreSQL│
         │ (Cache) │       │(Database)│
         │Port 6379│       │Port 5432 │
         └─────────┘       └─────────┘
```

## Request Flow

1. User → Nginx (port 80)
2. Nginx routes `/api/*`, `/auth/*` → backend:8000
3. Nginx routes everything else → frontend:3000
4. Frontend SSR or client-side React
5. Browser API calls go through Nginx to backend

## Tech Stack Details

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 14.2 | React framework with App Router |
| React | 18 | UI library |
| TypeScript | 5.4 | Type safety |
| Tailwind CSS | 3.4 | Utility-first styling |
| TanStack Query | 5 | Server state management |
| Recharts | 2 | Data visualization |
| Lucide React | 0.3 | Icon library |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| FastAPI | 0.111 | Async web framework |
| SQLAlchemy | 2.0 | Async ORM |
| Alembic | 1.13 | Database migrations |
| Pydantic | 2.7 | Data validation |
| python-jose | 3.3 | JWT handling |
| passlib | 1.7 | Password hashing |
| yfinance | 0.2 | Yahoo Finance data |
| httpx | 0.27 | Async HTTP client |
| apscheduler | 3.10 | Background tasks |
| slowapi | 0.1 | Rate limiting |

### Infrastructure

| Technology | Version | Purpose |
|-----------|---------|---------|
| PostgreSQL | 16 | Relational database |
| Redis | 7 | In-memory cache |
| Nginx | Alpine | Reverse proxy |
| Docker | 24+ | Containerization |
| Docker Compose | v2 | Multi-container orchestration |

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    email VARCHAR PRIMARY KEY,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Assets Table
```sql
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR REFERENCES users(email),
    type VARCHAR NOT NULL,  -- 'crypto', 'stocks', 'real_estate' (stored as values, not Python enum names)
    symbol VARCHAR NOT NULL,
    quantity FLOAT NOT NULL,
    purchase_price FLOAT NOT NULL,
    purchase_price_eur FLOAT DEFAULT 0,  -- PRU converted to EUR
    current_price FLOAT DEFAULT 0,
    currency VARCHAR DEFAULT 'EUR',
    purchase_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

> **Note**: `type` column stores enum values (`crypto`, `stocks`, `real_estate`), not Python enum names (`CRYPTO`, `STOCKS`). This is achieved via `values_callable=lambda x: [e.value for e in x]` on the SQLAlchemy `Enum`.

> **Note**: `purchase_price_eur` stores the purchase price converted to EUR using historical exchange rates at purchase time. `currency` stores the original currency.

### Transactions Table
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR REFERENCES users(email),
    asset_id UUID REFERENCES assets(id),
    type VARCHAR NOT NULL,  -- 'buy', 'sell' (stored as values)
    symbol VARCHAR NOT NULL,
    quantity FLOAT NOT NULL,
    unit_price FLOAT NOT NULL,
    currency VARCHAR DEFAULT 'EUR',
    exchange_rate FLOAT DEFAULT 1.0,
    fees FLOAT DEFAULT 0.0,
    total_invested FLOAT NOT NULL,
    date VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Price History Table
```sql
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL,
    price FLOAT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);
CREATE INDEX ix_price_history_asset_id ON price_history(asset_id);
CREATE INDEX ix_price_history_timestamp ON price_history(timestamp);
```

### Price Alerts Table
```sql
CREATE TABLE price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR REFERENCES users(email),
    symbol VARCHAR NOT NULL,
    target_price FLOAT NOT NULL,
    condition VARCHAR NOT NULL,  -- 'above', 'below'
    currency VARCHAR DEFAULT 'EUR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    triggered_at TIMESTAMP
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR REFERENCES users(email),
    message VARCHAR NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Exchange Rates Table
```sql
CREATE TABLE exchange_rates (
    currency VARCHAR PRIMARY KEY,
    rate_vs_usd FLOAT NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Key Design Decisions

### Enum Storage
SQLAlchemy `Enum` columns use `values_callable` to store human-readable values (`crypto`) instead of Python enum names (`CRYPTO`). This ensures DB portability and API consistency. Models expose a `type_value` property for serialization.

### DRY Response Mapping
Avoid repeated ORM-to-Pydantic dict construction. Each router with repeated mapping extracts a helper function (`_asset_to_response`, `_alert_to_response`, etc.).

### No Simulated Prices
If all price sources fail, `None` is returned — never random prices.

### Timezone-Aware Datetimes
All datetime generation uses `datetime.now(timezone.utc)` instead of deprecated `datetime.utcnow()`.

### Connection Pooling
Database engine uses `pool_size=20, max_overflow=10` to handle concurrent requests under load.

## Caching Strategy

| Data | TTL | Key Pattern |
|------|-----|-------------|
| Crypto prices | 60s | `crypto:{symbol}` |
| Stock prices | 300s | `stock:{symbol}` |
| Price history (OHLC) | 300s | `history:{type}:{symbol}` |
| Exchange rates | 3600s | `exchange_rates` |
| Historical exchange rates | 86400s | `historical_rate:{date}:{from}:{to}` |

## Authentication Flow

1. User submits email/password to `/auth/login`
2. Backend validates credentials with bcrypt
3. Backend issues JWT token (24h expiry, configurable)
4. Frontend stores token in `localStorage`
5. All subsequent API requests include `Authorization: Bearer {token}`
6. Backend validates token via `get_current_user` dependency
7. On 401 → frontend clears token and redirects to `/login`

### Security Notes
- `JWT_SECRET` **must** be set via env var — app refuses to start with default/insecure values
- Passwords hashed with bcrypt via passlib
- Rate limiting: 100 req/min per IP
- `DATABASE_URL` required — no hardcoded defaults in production