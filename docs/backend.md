# Backend Guide

## Project Structure

```
apps/backend/
├── app/
│   ├── main.py              # FastAPI app entry point, scheduler, middleware
│   ├── config.py            # Settings (env vars, validation)
│   ├── database.py          # Async engine, session factory, pool config
│   ├── models/              # SQLAlchemy models
│   │   ├── user.py
│   │   ├── asset.py         # Asset, PriceHistory (with type_value property)
│   │   ├── transaction.py   # Transaction (with type_value property)
│   │   ├── alert.py         # PriceAlert, PortfolioSnapshot, Notification
│   │   ├── exchange_rate.py # ExchangeRate
│   │   └── __init__.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── auth.py
│   │   ├── assets.py
│   │   ├── alerts.py
│   │   ├── notifications.py
│   │   ├── transactions.py
│   │   ├── exchange_rates.py
│   │   └── __init__.py
│   ├── routers/             # API route handlers
│   │   ├── auth.py
│   │   ├── assets.py        # CRUD + bulk-delete, dedup, import, backfill
│   │   ├── portfolio.py     # Summary, history, statistics, export, benchmark
│   │   ├── prices.py
│   │   ├── alerts.py
│   │   ├── notifications.py
│   │   ├── transactions.py
│   │   ├── exchange_rates.py
│   │   ├── cache.py
│   │   ├── monitoring.py
│   │   └── demo.py
│   └── services/            # Business logic
│       ├── price_service.py  # Price fetching, history, exchange rates
│       ├── cache_service.py  # Redis caching
│       └── __init__.py
├── alembic/                  # Database migrations
│   ├── versions/
│   └── env.py
├── Dockerfile
└── requirements.txt
```

## Configuration

Settings loaded from `app/config.py` via Pydantic `BaseSettings`. **All secrets must be set via env vars or `.env` file** — the app raises `RuntimeError` on startup if `DATABASE_URL` or `JWT_SECRET` are missing or use known-insecure defaults.

| Setting | Env Var | Required | Description |
|---------|---------|----------|-------------|
| DATABASE_URL | DATABASE_URL | Yes | PostgreSQL async connection string |
| REDIS_URL | REDIS_URL | No | Redis connection (default: `redis://localhost:6379/0`) |
| JWT_SECRET | JWT_SECRET | Yes | Must differ from default placeholders |
| JWT_ALGORITHM | JWT_ALGORITHM | No | Default: `HS256` |
| ACCESS_TOKEN_EXPIRE_MINUTES | ACCESS_TOKEN_EXPIRE_MINUTES | No | Default: `1440` (24h) |
| ALLOWED_ORIGINS | ALLOWED_ORIGINS | No | CORS origins (default: `http://localhost:3000`) |
| PYTHON_ENV | PYTHON_ENV | No | `development` or `production` |

### Database Connection

```python
# Production: pool_size=20, max_overflow=10, echo=False
# Development: echo=True automatically
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=(settings.PYTHON_ENV == "development"),
    pool_size=20,
    max_overflow=10,
)
```

## Models & DRY Conventions

### `type_value` Property

All enum-backed models expose a `type_value` property for consistent serialization:

```python
class Asset(Base):
    # ...
    @property
    def type_value(self) -> str:
        return self.type.value if hasattr(self.type, 'value') else str(self.type)
```

Use `asset.type_value` instead of `asset.type.value if hasattr(...)` everywhere.

### Enum Column Storage

SQLAlchemy `Enum` columns **must** use `values_callable`:

```python
type = Column(Enum(AssetType, values_callable=lambda x: [e.value for e in x]))
```

This stores `"crypto"` in DB instead of `"CRYPTO"`.

### Response Helpers

Each router with repeated ORM→schema mapping extracts a helper:

```python
# assets.py
def _asset_to_response(asset: Asset) -> AssetResponse: ...

# alerts.py
def _alert_to_response(alert: PriceAlert) -> PriceAlertResponse: ...

# notifications.py
def _notification_to_response(n: Notification) -> NotificationResponse: ...

# transactions.py
def _tx_to_response(tx: Transaction) -> TransactionResponse: ...
```

## Services

### PriceService (`services/price_service.py`)

- **Stocks**: Yahoo Finance Chart API → yfinance fallback. No simulated prices.
- **Crypto**: CryptoCompare API. TTL: 60s cache, 1s API timeout.
- **Real estate**: Fixed EUR/m² per city.
- **Exchange rates**: Frankfurter API with Redis cache (1h TTL) + hardcoded fallback.

Key methods:
```python
await price_service.get_price("stocks", "AAPL")
await price_service.get_price("crypto", "BTC")
await price_service.auto_refresh_all_prices(db)
await price_service.backfill_price_history(db, asset_id, symbol, asset_type, start_date)
await price_service.get_historical_exchange_rate(date, from_currency, to_currency)
```

### CacheService (`services/cache_service.py`)

Redis async wrapper. TTLs: crypto 60s, stocks 300s, exchange rates 3600s.

## Authentication

- JWT with 24h expiry (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- `OAuth2PasswordRequestForm` for login (form-data, not JSON)
- `get_current_user` dependency validates token and fetches user from DB
- Uses `datetime.now(timezone.utc)` (not deprecated `datetime.utcnow()`)

## Background Tasks

APScheduler refreshes all asset prices every 5 minutes. Uses `logging` (not `print()`).

## Rate Limiting

100 req/min per IP via slowapi. `429 Too Many Requests` on exceed.

## Request Logging

All requests logged via `logging.info` with method, path, status, duration. Metrics aggregated in `app.state.metrics`.

## Database Migrations

```bash
# Inside container
docker exec infra-backend-1 alembic revision --autogenerate -m "description"
docker exec infra-backend-1 alembic upgrade head
```

Migrations numbered sequentially (`001`, `002`, ...). `down_revision` must reference the previous revision exactly.