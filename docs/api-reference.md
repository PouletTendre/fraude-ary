# API Reference

Base URL: `http://localhost` (via Nginx proxy)

All protected endpoints require:
```
Authorization: Bearer <token>
```

## Authentication

### POST /auth/login
Login with email and password (OAuth2 form-data).

**Request:**
```bash
curl -X POST http://localhost/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=demo@fraude-ary.com&password=demo123456"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "email": "demo@fraude-ary.com",
    "full_name": "Demo User"
  }
}
```

### POST /auth/register
Register a new user.

**Request:**
```bash
curl -X POST http://localhost/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepass123", "full_name": "John Doe"}'
```

**Response:** Same as login.

### GET /auth/me
Get current authenticated user.

## Assets

### GET /api/v1/assets
List all assets for the authenticated user.

**Response:**
```json
[
  {
    "id": "550e8400-...",
    "user_email": "user@example.com",
    "type": "stocks",
    "symbol": "AAPL",
    "quantity": 10.0,
    "purchase_price": 150.0,
    "purchase_price_eur": 138.0,
    "current_price": 273.43,
    "total_value": 2734.30,
    "purchase_date": "2024-01-15",
    "currency": "EUR",
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

### GET /api/v1/assets/{type}
List assets filtered by type (`crypto`, `stocks`, `real_estate`).

### POST /api/v1/assets
Create or merge an asset. If symbol+type already exists, quantities merge with weighted average price.

**Request:**
```json
{
  "type": "stocks",
  "symbol": "AIR.PA",
  "quantity": 5,
  "purchase_price": 125.50,
  "purchase_date": "2024-03-01",
  "currency": "EUR"
}
```

**Response:** Returns the created/updated `AssetResponse` with `purchase_price_eur` auto-calculated via historical exchange rate.

### PUT /api/v1/assets/{id}
Update an existing asset (quantity, purchase_price, purchase_price_eur). Syncs associated BUY transaction.

### DELETE /api/v1/assets/{id}
Delete an asset and its associated transactions. Returns `204 No Content`.

### POST /api/v1/assets/bulk-delete
Delete multiple assets by ID.

**Request:**
```json
["id1", "id2", "id3"]
```

**Response:** `204 No Content`

### POST /api/v1/assets/dedup
Merge duplicate assets (same symbol+type) by weighted average PRU. Transfers linked transactions to the master asset, deletes duplicates.

**Response:**
```json
{
  "merged_groups": 2,
  "total_assets_before": 8,
  "total_assets_after": 6
}
```

### POST /api/v1/assets/import
Import assets from CSV file.

**Required CSV columns:** `type`, `symbol`, `quantity`, `purchase_price`, `purchase_date`

**Request:**
```bash
curl -X POST http://localhost/api/v1/assets/import \
  -H "Authorization: Bearer <token>" \
  -F "file=@assets.csv"
```

**Response:**
```json
{
  "status": "success",
  "imported_count": 5,
  "errors": []
}
```

### POST /api/v1/assets/{id}/backfill-history
Backfill historical prices from purchase date to now.

**Response:**
```json
{
  "backfilled_entries": 42
}
```

### GET /api/v1/assets/search/symbols
Search stock/crypto symbols via Yahoo Finance.

**Query Parameters:**
- `q` (required, min 1 char): Search query

**Response:**
```json
[
  {"symbol": "AIR.PA", "name": "AIRBUS SE", "type": "stocks", "exchange": "PAR"}
]
```

### GET /api/v1/assets/{id}/history
Get enriched price history for an asset.

**Response:**
```json
{
  "asset_id": "550e8400-...",
  "symbol": "AAPL",
  "current_price": 273.43,
  "ohlc": null,
  "history": [
    {"price": 270.50, "timestamp": "2024-05-31T16:00:00Z"}
  ]
}
```

### POST /api/v1/assets/refresh-prices
Refresh all asset prices from external APIs.

**Response:**
```json
{
  "status": "success",
  "prices_updated": 3,
  "prices": {"AAPL": 273.43, "BTC": 77863.56},
  "errors": []
}
```

## Portfolio

### GET /api/v1/portfolio/summary
Portfolio summary with total value, P&L, allocation, and performance history. All values converted to EUR using exchange rates.

### GET /api/v1/portfolio/history?period={1w|1m|3m|1y}
Portfolio value history for a time period.

### GET /api/v1/portfolio/statistics
Advanced stats: best/worst performer, volatility, Sharpe ratio, market benchmark comparison.

### GET /api/v1/portfolio/export?format={json|csv}
Export portfolio as CSV or JSON download.

### GET /api/v1/portfolio/benchmark?symbol=SPY&period=1y
Compare portfolio performance against a benchmark (default: SPY).

## Transactions

### GET /api/v1/transactions
List all transactions for the authenticated user.

### POST /api/v1/transactions
Create a buy/sell transaction.

### PUT /api/v1/transactions/{id}
Update a transaction.

### DELETE /api/v1/transactions/{id}
Delete a transaction.

## Alerts

### GET /api/v1/alerts
List all price alerts.

### GET /api/v1/alerts/count
Get total and active alert counts.

### POST /api/v1/alerts
Create a price alert (symbol, target_price, condition: above/below, currency).

### PUT /api/v1/alerts/{id}
Update an alert (target_price, condition, is_active).

### DELETE /api/v1/alerts/{id}
Delete an alert.

## Notifications

### GET /api/v1/notifications
List unread notifications.

### POST /api/v1/notifications/read-all
Mark all notifications as read.

### PUT /api/v1/notifications/{id}/read
Mark single notification as read.

## Exchange Rates

### GET /api/v1/exchange-rates
Current exchange rates (USD, EUR, GBP, JPY, CHF). Cached 1h in Redis.

## Prices

### POST /api/v1/prices/refresh
Alias for `/api/v1/assets/refresh-prices`.

### GET /api/v1/prices/current/{symbol}
Get current price for a symbol (auto-detects crypto vs stock).

## Cache

### GET /api/v1/cache/stats
Redis cache statistics.

### POST /api/v1/cache/clear
Clear all cached data.

## Health & Monitoring

### GET /health
Simple health check. Returns `{"status": "ok"}`.

### GET /api/v1/health/detailed
Detailed health with DB and Redis connectivity.

### GET /api/v1/health/metrics
Request metrics and performance data.