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

1. User accesses `http://localhost`
2. Nginx routes `/api/*` and `/auth/*` to the backend (port 8000)
3. Nginx routes all other paths to the frontend (port 3000)
4. The frontend serves Server-Side Rendered (SSR) pages or client-side React apps
5. API calls from the browser go through Nginx to the backend

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
    type VARCHAR NOT NULL, -- crypto, stocks, real_estate
    symbol VARCHAR NOT NULL,
    quantity FLOAT NOT NULL,
    purchase_price FLOAT NOT NULL,
    current_price FLOAT DEFAULT 0,
    purchase_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Price History Table
```sql
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    price FLOAT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

### Price Alerts Table
```sql
CREATE TABLE price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR REFERENCES users(email),
    symbol VARCHAR NOT NULL,
    target_price FLOAT NOT NULL,
    condition VARCHAR NOT NULL, -- above, below
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
    title VARCHAR NOT NULL,
    message VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Caching Strategy

| Data | TTL | Key Pattern |
|------|-----|-------------|
| Crypto prices | 60s | `crypto:{symbol}` |
| Stock prices | 300s | `stock:{symbol}` |
| Price history (OHLC) | 300s | `history:{type}:{symbol}` |
| Exchange rates | 3600s | `exchange_rate:{currency}` |

## Authentication Flow

1. User submits email/password to `/auth/login`
2. Backend validates credentials with bcrypt
3. Backend issues JWT token (24h expiry)
4. Frontend stores token in `localStorage`
5. All subsequent API requests include `Authorization: Bearer {token}`
6. Backend validates token on each protected endpoint
7. On 401, frontend redirects to `/login`

## Design Decisions

### Why FastAPI + Async SQLAlchemy?
FastAPI provides native async support and automatic OpenAPI docs. Async SQLAlchemy prevents blocking the event loop during DB operations.

### Why Next.js App Router?
App Router enables server components, nested layouts, and simpler data fetching patterns compared to the Pages Router.

### Why Redis?
Redis caches external API responses to avoid rate limits (Yahoo Finance, CryptoCompare) and improve response times.

### Why Self-Hosted?
Financial data is sensitive. Self-hosting ensures privacy and avoids subscription fees for portfolio tracking SaaS products.
