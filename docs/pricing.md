# Pricing & Data Sources

## Overview

Fraude-Ary fetches real-time market data from external APIs. This document explains the price fetching strategy, data sources, and caching mechanisms.

## Data Sources

### Stocks — Yahoo Finance

**Primary API:** `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}`

**How it works:**
1. Backend makes an HTTP GET request to Yahoo Finance Chart API
2. Parses JSON response for `meta.regularMarketPrice` or `previousClose`
3. Falls back to closing price from `indicators.quote[].close[]` if meta is empty
4. Caches result in Redis for 5 minutes

**Fallback:** If the HTTP API fails (rare), the system tries `yfinance` Python library.

**Supported symbols:**
- US stocks: `AAPL`, `TSLA`, `GOOGL`
- European stocks: `AIR.PA` (Airbus Paris), `SAP.DE` (SAP Germany)
- ETFs: `SPY`, `QQQ`, `EWJ`
- Any symbol traded on Yahoo Finance

**Rate limits:** Yahoo Finance doesn't publish official limits, but aggressive scraping may trigger blocks. The 5-minute cache helps avoid this.

### Cryptocurrencies — CryptoCompare

**API:** `https://min-api.cryptocompare.com/data/price?fsym={symbol}&tsyms=USD`

**How it works:**
1. Backend queries CryptoCompare for the symbol in USD
2. Parses JSON response for the `USD` field
3. Caches result in Redis for 1 minute

**Supported symbols:**
- Major coins: `BTC`, `ETH`, `SOL`, `ADA`, `DOT`
- Most tokens listed on CoinMarketCap/CoinGecko

**Rate limits:** Free tier allows 100k calls/month. The 1-minute cache is well within limits.

### Real Estate — Static Data

Real estate doesn't have a real-time global API, so prices are stored as static values.

**Prices (EUR/m2):**

| City | Price/m2 |
|------|----------|
| Paris | 12,500 |
| Lyon | 5,500 |
| Marseille | 4,200 |
| Bordeaux | 4,800 |
| Nice | 6,000 |
| London | 15,000 |
| New York | 18,000 |
| Miami | 7,000 |
| Tokyo | 9,000 |
| Dubai | 5,000 |

**How it works:**
The backend matches the input symbol against city names (case-insensitive, fuzzy matching). If a match is found, the fixed price is returned.

## Caching Strategy

| Asset Type | TTL | Rationale |
|-----------|-----|-----------|
| Crypto | 60s | High volatility, frequent updates needed |
| Stocks | 300s | Lower volatility, reduce API calls |
| Real Estate | N/A | Static data, no caching needed |
| Price History | 300s | OHLC data changes slowly |
| Exchange Rates | 3600s | Currency rates change slowly |

**Cache Keys:**
- Crypto: `crypto:{symbol_upper}`
- Stocks: `stock:{symbol_upper}`
- History: `history:{type}:{symbol_upper}`
- Exchange: `exchange_rate:{currency}`

## Auto-Refresh

A background task runs every 5 minutes to refresh all asset prices:

1. Query all assets from PostgreSQL
2. For each asset, call the appropriate price fetcher
3. Update `current_price` in the database
4. Insert a new row into `price_history`
5. Commit the transaction

**Logging:**
```
[Auto-Refresh] Updated 5 prices. Errors: []
```

## Manual Refresh

Users can trigger a manual refresh via:
- **UI:** Button on the Portfolio page
- **API:** `POST /api/v1/prices/refresh` or `POST /api/v1/assets/refresh-prices`

## No Simulated Prices

Earlier versions of Fraude-Ary used `random.uniform()` to generate fake prices when APIs failed. **This has been completely removed.** The system now strictly returns real market prices or `None` if the API is unavailable.

If a price cannot be fetched:
- Asset creation falls back to `purchase_price` as the initial `current_price`
- The auto-refresh will retry on the next cycle
- No fake/random prices are ever stored

## Adding a New Data Source

To integrate a new price provider:

1. Create a new method in `PriceService`:
```python
async def get_price_from_new_source(self, symbol: str) -> Optional[float]:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"https://api.newsource.com/price/{symbol}")
            if resp.status_code == 200:
                return float(resp.json()["price"])
    except Exception:
        return None
```

2. Add caching:
```python
await cache_service.set(f"newsource:{symbol}", price, ttl=300)
```

3. Wire into `get_price()` method:
```python
elif asset_type == "new_type":
    return await self.get_price_from_new_source(symbol)
```

## Reliability Notes

- **Yahoo Finance** may occasionally block requests. The system handles this gracefully by returning the last known price.
- **CryptoCompare** has excellent uptime and generous free limits.
- **Network issues** between containers are rare but possible. Ensure Docker networking is healthy.
- **Market hours** — Stock prices outside market hours will return the last closing price.
