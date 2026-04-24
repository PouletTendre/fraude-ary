# API Reference

Base URL: `http://localhost` (via Nginx proxy)

All protected endpoints require the header:
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
  -d '{
    "email": "user@example.com",
    "password": "securepass123",
    "full_name": "John Doe"
  }'
```

**Response:**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe"
}
```

### GET /auth/me
Get current authenticated user.

**Response:**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe"
}
```

## Assets

### GET /api/v1/assets
List all assets for the authenticated user.

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_email": "user@example.com",
    "type": "stocks",
    "symbol": "AAPL",
    "quantity": 10.0,
    "purchase_price": 150.0,
    "current_price": 273.43,
    "total_value": 2734.30,
    "purchase_date": "2024-01-15",
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

### GET /api/v1/assets/{type}
List assets filtered by type (`crypto`, `stocks`, `real_estate`).

### POST /api/v1/assets
Create a new asset.

**Request:**
```json
{
  "type": "stocks",
  "symbol": "AIR.PA",
  "quantity": 5,
  "purchase_price": 125.50,
  "purchase_date": "2024-03-01"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_email": "user@example.com",
  "type": "stocks",
  "symbol": "AIR.PA",
  "quantity": 5.0,
  "purchase_price": 125.50,
  "current_price": 142.30,
  "total_value": 711.50,
  "purchase_date": "2024-03-01",
  "created_at": "2024-06-01T12:00:00Z"
}
```

### PUT /api/v1/assets/{id}
Update an existing asset.

**Request:**
```json
{
  "quantity": 15,
  "purchase_price": 140.0
}
```

### DELETE /api/v1/assets/{id}
Delete an asset. Returns `204 No Content` on success.

### GET /api/v1/assets/search/symbols
Search for stock/crypto symbols via Yahoo Finance.

**Query Parameters:**
- `q` (required, min 1 char): Search query

**Request:**
```bash
curl "http://localhost/api/v1/assets/search/symbols?q=airbus"
```

**Response:**
```json
[
  {
    "symbol": "AIR.PA",
    "name": "AIRBUS SE",
    "type": "stocks",
    "exchange": "PAR"
  }
]
```

### GET /api/v1/assets/{id}/history
Get enriched price history for an asset.

**Response:**
```json
{
  "asset_id": "550e8400...",
  "symbol": "AAPL",
  "current_price": 273.43,
  "ohlc": {
    "open": 271.50,
    "high": 274.20,
    "low": 270.80,
    "close": 273.43,
    "timestamp": "2024-06-01T16:00:00Z"
  },
  "history": [
    {"price": 270.50, "timestamp": "2024-05-31T16:00:00Z"}
  ]
}
```

### POST /api/v1/assets/import
Import assets from a CSV file.

**Required CSV columns:** `type`, `symbol`, `quantity`, `purchase_price`, `purchase_date`

**Request:**
```bash
curl -X POST http://localhost/api/v1/assets/import \
  -H "Authorization: Bearer <token>" \
  -F "file=@assets.csv"
```

### POST /api/v1/assets/refresh-prices
Manually refresh all asset prices. Returns updated count and any errors.

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
Get portfolio summary with allocation and history.

**Response:**
```json
{
  "total_value": 15420.50,
  "total_gain_loss": 2420.50,
  "gain_loss_percentage": 18.62,
  "by_type": [
    {"type": "stocks", "value": 10000, "percentage": 64.85},
    {"type": "crypto", "value": 5420.50, "percentage": 35.15}
  ],
  "history": [
    {"date": "2024-05-01", "value": 14000},
    {"date": "2024-06-01", "value": 15420.50}
  ]
}
```

### GET /api/v1/portfolio/statistics
Get advanced statistics: volatility, Sharpe ratio, best/worst performers.

### GET /api/v1/portfolio/export?format={json|csv}
Export portfolio data.

## Prices

### POST /api/v1/prices/refresh
Alias for `/api/v1/assets/refresh-prices`. Refresh all prices.

### GET /api/v1/prices/current/{symbol}
Get current price for a symbol.

## Alerts

### GET /api/v1/alerts
List all price alerts.

### POST /api/v1/alerts
Create a price alert.

**Request:**
```json
{
  "symbol": "AAPL",
  "target_price": 300.0,
  "condition": "above"
}
```

### DELETE /api/v1/alerts/{id}
Delete a price alert.

## Notifications

### GET /api/v1/notifications
List notifications for the current user.

### PATCH /api/v1/notifications/{id}/read
Mark a notification as read.

### DELETE /api/v1/notifications/{id}
Delete a notification.

## Exchange Rates

### GET /api/v1/exchange-rates
Get current exchange rates (USD, EUR, GBP, JPY, CHF).

## Cache

### GET /api/v1/cache/stats
Get Redis cache statistics.

### POST /api/v1/cache/clear
Clear all cached data.

## Health & Monitoring

### GET /health
Simple health check.

**Response:** `{"status": "ok"}`

### GET /api/v1/health/detailed
Detailed health check with DB and Redis connectivity.

### GET /api/v1/health/metrics
Request metrics and performance data.
