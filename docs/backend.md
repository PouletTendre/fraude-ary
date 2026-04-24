# Backend Guide

## Project Structure

```
apps/backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings and configuration
│   ├── database.py          # Database engine and session
│   ├── models/              # SQLAlchemy models
│   │   ├── user.py
│   │   ├── asset.py
│   │   └── __init__.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── auth.py
│   │   ├── assets.py
│   │   ├── portfolio.py
│   │   └── __init__.py
│   ├── routers/             # API route handlers
│   │   ├── auth.py
│   │   ├── assets.py
│   │   ├── portfolio.py
│   │   ├── prices.py
│   │   ├── alerts.py
│   │   ├── notifications.py
│   │   ├── exchange_rates.py
│   │   ├── cache.py
│   │   ├── monitoring.py
│   │   └── demo.py
│   └── services/            # Business logic
│       ├── price_service.py
│       ├── cache_service.py
│       └── __init__.py
├── alembic/                 # Database migrations
│   ├── versions/
│   └── env.py
├── Dockerfile
└── requirements.txt
```

## Services

### PriceService (`services/price_service.py`)

Fetches real-time prices from external APIs.

**Crypto Prices:**
- Source: CryptoCompare API
- Endpoint: `GET /data/price?fsym={symbol}&tsyms=USD`
- Cache TTL: 60 seconds

**Stock Prices:**
- Primary: Yahoo Finance Chart API (`query1.finance.yahoo.com/v8/finance/chart`)
- Fallback: yfinance library
- Cache TTL: 300 seconds

**Real Estate Prices:**
- Fixed prices per city (EUR/m2)
- No external API (static data)

**Key Methods:**
```python
await price_service.get_price("stocks", "AAPL")  # -> 273.43
await price_service.get_price("crypto", "BTC")    # -> 77863.56
await price_service.auto_refresh_all_prices(db)   # Refresh all assets
```

### CacheService (`services/cache_service.py`)

Redis wrapper for price caching.

**Key Methods:**
```python
await cache_service.get_crypto_price("BTC")
await cache_service.set_stock_price("AAPL", 273.43)
await cache_service.clear()
```

## Authentication

### JWT Token Flow

1. User submits credentials via `/auth/login`
2. `OAuth2PasswordRequestForm` validates email/password
3. `bcrypt` verifies password hash
4. JWT token generated with 24-hour expiry
5. Token returned to client

### Token Validation

```python
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    email = payload.get("sub")
    # Fetch user from DB
    return user
```

## Background Tasks

### Auto Price Refresh

An APScheduler job runs every 5 minutes to refresh all asset prices:

```python
scheduler.add_job(
    refresh_prices_task,
    "interval",
    minutes=5,
    id="price_refresh",
    replace_existing=True
)
```

### Refresh Logic

1. Query all assets from the database
2. For each asset, call `price_service.get_price()`
3. Update `current_price` field
4. Save price history entry
5. Commit transaction

## Rate Limiting

- Global limit: 100 requests/minute per IP
- Using slowapi with Redis-backed storage
- Exceeded requests return `429 Too Many Requests`

## Request Logging

All requests are logged with:
- HTTP method and path
- Response status code
- Response duration (ms)
- Aggregated metrics per endpoint

Access logs: `[GET] /api/v1/assets - 200 - 0.003s`

## Database Migrations

Migrations are managed with Alembic.

**Auto-run on startup:**
```dockerfile
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
```

**Manual migration:**
```bash
docker exec infra-backend-1 alembic revision --autogenerate -m "description"
docker exec infra-backend-1 alembic upgrade head
```

## Environment Configuration

Settings are loaded from `app/config.py` using Pydantic `BaseSettings`:

| Setting | Env Var | Default |
|---------|---------|---------|
| DATABASE_URL | DATABASE_URL | postgresql+asyncpg://... |
| REDIS_URL | REDIS_URL | redis://redis:6379 |
| JWT_SECRET | JWT_SECRET | prodsecretchange123 |
| JWT_ALGORITHM | JWT_ALGORITHM | HS256 |
| ALLOWED_ORIGINS | ALLOWED_ORIGINS | * |
