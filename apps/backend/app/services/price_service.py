import asyncio
import httpx
import logging
import uuid
import yfinance
from typing import Optional, Dict, List, Any, Tuple
from datetime import datetime, timezone
from app.services.cache_service import cache_service
from app.models.asset import Asset, PriceHistory
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

CRYPTO_COMPARE_API = "https://min-api.cryptocompare.com/data"
YAHOO_CHART_API = "https://query1.finance.yahoo.com/v8/finance/chart"
EXCHANGE_RATE_API_URL = "https://api.frankfurter.app/latest?from=EUR"
REDIS_KEY_EXCHANGE_RATES = "exchange_rates"
CACHE_TTL_EXCHANGE = 3600

CACHE_TTL_STOCK = 300
CACHE_TTL_CRYPTO = 60
CACHE_TTL_HISTORY = 86400

# Default exchange rates (fallback when API is unavailable)
DEFAULT_EXCHANGE_RATES = {
    "EUR": 1.0,
    "USD": 1.087,
    "GBP": 0.85,
    "JPY": 162.0,
    "CHF": 0.95,
}

# Fixed real estate prices per city (EUR/m2)
REAL_ESTATE_PRICES = {
    "paris": 12500,
    "lyon": 5500,
    "marseille": 4200,
    "bordeaux": 4800,
    "nice": 6000,
    "london": 15000,
    "newyork": 18000,
    "miami": 7000,
    "tokyo": 9000,
    "dubai": 5000,
}

class PriceService:
    async def get_crypto_price(self, symbol: str) -> Optional[float]:
        symbol_upper = symbol.upper()
        cached = await cache_service.get_crypto_price(symbol_upper)
        if cached:
            return cached

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{CRYPTO_COMPARE_API}/price",
                    params={"fsym": symbol_upper, "tsyms": "USD"}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    price = data.get("USD")
                    if price and price > 0:
                        await cache_service.set_crypto_price(symbol_upper, price)
                        return price
        except Exception as e:
            logging.warning(f"CryptoCompare failed for {symbol_upper}: {e}")

        return None

    async def get_stock_price(self, symbol: str) -> Optional[float]:
        symbol_upper = symbol.upper()
        cached = await cache_service.get_stock_price(symbol_upper)
        if cached:
            return cached

        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                url = f"{YAHOO_CHART_API}/{symbol_upper}?interval=1d&range=1d"
                resp = await client.get(url, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                })
                if resp.status_code == 200:
                    data = resp.json()
                    result = data.get("chart", {}).get("result", [None])[0]
                    if result:
                        meta = result.get("meta", {})
                        price = meta.get("regularMarketPrice") or meta.get("previousClose")
                        if not price:
                            quotes = result.get("indicators", {}).get("quote", [{}])[0]
                            closes = [c for c in quotes.get("close", []) if c is not None]
                            if closes:
                                price = closes[-1]
                        if price and price > 0:
                            await cache_service.set_stock_price(symbol_upper, float(price))
                            return float(price)
        except Exception as e:
            logging.warning(f"Yahoo chart API failed for {symbol_upper}: {e}")

        try:
            def fetch_yf():
                ticker = yfinance.Ticker(symbol_upper)
                hist = ticker.history(period="1d")
                if not hist.empty:
                    return float(hist["Close"].iloc[-1])
                info = ticker.info
                return info.get("regularMarketPrice") or info.get("previousClose")
            price = await asyncio.to_thread(fetch_yf)
            if price and price > 0:
                await cache_service.set_stock_price(symbol_upper, float(price))
                return float(price)
        except Exception as e:
            logging.warning(f"yfinance failed for {symbol_upper}: {e}")

        logging.error(f"Could not fetch real price for stock {symbol_upper}")
        return None

    async def get_real_estate_price(self, symbol: str) -> Optional[float]:
        symbol_normalized = symbol.lower().replace(" ", "").replace(",", "")
        for city, price in REAL_ESTATE_PRICES.items():
            if city in symbol_normalized:
                return float(price)
        if symbol_normalized in REAL_ESTATE_PRICES:
            return float(REAL_ESTATE_PRICES[symbol_normalized])
        return None

    async def get_price(self, asset_type: str, symbol: str) -> Optional[float]:
        if asset_type == "crypto":
            return await self.get_crypto_price(symbol)
        elif asset_type == "stocks":
            return await self.get_stock_price(symbol)
        elif asset_type == "real_estate":
            return await self.get_real_estate_price(symbol)
        return None

    async def save_price_history(self, db: AsyncSession, asset_id: str, price: float) -> None:
        history_entry = PriceHistory(
            id=str(uuid.uuid4()),
            asset_id=asset_id,
            price=price,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(history_entry)

    async def get_current_price(self, symbol: str) -> Optional[float]:
        price = await self.get_crypto_price(symbol)
        if price:
            return price
        return await self.get_stock_price(symbol)

    async def refresh_crypto_prices(self, symbols: List[str]) -> Dict[str, float]:
        async def fetch_one(symbol: str) -> Tuple[str, Optional[float]]:
            price = await self.get_crypto_price(symbol)
            return (symbol, price)

        fetched = await asyncio.gather(*[fetch_one(s) for s in symbols])
        return {sym: price for sym, price in fetched if price is not None}

    async def refresh_stock_prices(self, symbols: List[str]) -> Dict[str, float]:
        async def fetch_one(symbol: str) -> Tuple[str, Optional[float]]:
            price = await self.get_stock_price(symbol)
            return (symbol, price)

        fetched = await asyncio.gather(*[fetch_one(s) for s in symbols])
        return {sym: price for sym, price in fetched if price is not None}

    async def get_benchmark_data(self, symbol: str, period: str = "1y") -> Optional[Dict]:
        try:
            def fetch_history():
                ticker = yfinance.Ticker(symbol.upper())
                hist = ticker.history(period=period)
                if hist.empty:
                    return None
                first_price = float(hist["Close"].iloc[0])
                last_price = float(hist["Close"].iloc[-1])
                returns = hist["Close"].pct_change().dropna().tolist()
                return {
                    "first_price": first_price,
                    "last_price": last_price,
                    "returns": returns,
                    "history": hist["Close"].tolist(),
                }
            return await asyncio.to_thread(fetch_history)
        except Exception as e:
            logging.warning(f"Failed to fetch benchmark data for {symbol}: {e}")
            return None

    async def get_stock_history(self, symbol: str, start: datetime, end: datetime) -> List[Tuple[datetime, float]]:
        symbol_upper = symbol.upper()
        results: List[Tuple[datetime, float]] = []
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                url = f"{YAHOO_CHART_API}/{symbol_upper}"
                params = {
                    "period1": int(start.timestamp()),
                    "period2": int(end.timestamp()),
                    "interval": "1d",
                }
                resp = await client.get(url, params=params, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                })
                if resp.status_code == 200:
                    data = resp.json()
                    result = data.get("chart", {}).get("result", [None])[0]
                    if result:
                        timestamps = result.get("timestamp", [])
                        quotes = result.get("indicators", {}).get("quote", [{}])[0]
                        closes = quotes.get("close", [])
                        for ts, close in zip(timestamps, closes):
                            if close is not None and ts is not None:
                                dt = datetime.utcfromtimestamp(ts)
                                results.append((dt, float(close)))
        except Exception as e:
            logging.warning(f"Yahoo chart history API failed for {symbol_upper}: {e}")
        return results

    async def get_crypto_history(self, symbol: str, start: datetime, end: datetime) -> List[Tuple[datetime, float]]:
        symbol_upper = symbol.upper()
        results: List[Tuple[datetime, float]] = []
        days = (end - start).days + 1
        if days <= 0:
            return results
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                url = f"{CRYPTO_COMPARE_API}/v2/histoday"
                params = {
                    "fsym": symbol_upper,
                    "tsym": "USD",
                    "limit": days,
                    "toTs": int(end.timestamp()),
                }
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    data_array = data.get("Data", {}).get("Data", [])
                    for item in data_array:
                        ts = item.get("time")
                        close = item.get("close")
                        if ts is not None and close is not None:
                            dt = datetime.utcfromtimestamp(ts)
                            results.append((dt, float(close)))
        except Exception as e:
            logging.warning(f"CryptoCompare histoday API failed for {symbol_upper}: {e}")
        return results

    async def backfill_price_history(self, db: AsyncSession, asset_id: str, symbol: str, asset_type: str, start_date: datetime) -> int:
        end_date = datetime.now(timezone.utc)
        if start_date > end_date:
            return 0

        if asset_type == "crypto":
            history = await self.get_crypto_history(symbol, start_date, end_date)
        elif asset_type == "stocks":
            history = await self.get_stock_history(symbol, start_date, end_date)
        else:
            return 0

        if not history:
            logging.warning(f"No historical data returned for {symbol} ({asset_type})")
            return 0

        # Query existing timestamps for this asset to avoid duplicates per day
        result = await db.execute(
            select(PriceHistory.timestamp).where(
                PriceHistory.asset_id == asset_id,
                PriceHistory.timestamp >= start_date,
                PriceHistory.timestamp <= end_date
            )
        )
        existing_dates = {row.date() for row in result.scalars().all()}

        inserted = 0
        for ts, price in history:
            if ts.date() not in existing_dates:
                entry = PriceHistory(
                    id=str(uuid.uuid4()),
                    asset_id=asset_id,
                    price=price,
                    timestamp=ts
                )
                db.add(entry)
                inserted += 1

        await db.commit()
        return inserted

    async def get_historical_exchange_rate(self, date: datetime, from_currency: str, to_currency: str = "EUR") -> float:
        if from_currency.upper() == to_currency.upper():
            return 1.0

        date_str = date.strftime("%Y-%m-%d") if hasattr(date, "strftime") else str(date)
        cache_key = f"historical_rate:{date_str}:{from_currency.upper()}:{to_currency.upper()}"

        try:
            cached = await cache_service.get(cache_key)
            if cached is not None and isinstance(cached, dict):
                rate = cached.get("rate")
                if rate is not None:
                    return float(rate)
        except Exception as e:
            logging.warning(f"Redis cache miss for historical rate: {e}")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"https://api.frankfurter.app/{date_str}"
                params = {"from": from_currency.upper(), "to": to_currency.upper()}
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    rates = data.get("rates", {})
                    rate = rates.get(to_currency.upper())
                    if rate is not None and rate > 0:
                        try:
                            await cache_service.set(cache_key, {"rate": rate}, ttl=CACHE_TTL_HISTORY)
                        except Exception as e:
                            logging.warning(f"Redis cache set for historical rate failed: {e}")
                        return float(rate)
        except Exception as e:
            logging.warning(f"Frankfurter historical API failed for {date_str} {from_currency}->{to_currency}: {e}")

        # Fallback to current rates
        try:
            rates = await get_exchange_rates()
            from_rate = rates.get(from_currency.upper())
            to_rate = rates.get(to_currency.upper())
            if from_rate and to_rate and from_rate > 0:
                return to_rate / from_rate
        except Exception as e:
            logging.warning(f"Current rate fallback failed: {e}")

        # Hardcoded fallback
        fallback_rates: Dict[Tuple[str, str], float] = {
            ("USD", "EUR"): 0.9234,
            ("EUR", "USD"): 1.083,
            ("GBP", "EUR"): 1.18,
            ("EUR", "GBP"): 0.847,
            ("JPY", "EUR"): 0.0061,
            ("EUR", "JPY"): 164.0,
            ("CHF", "EUR"): 1.06,
            ("EUR", "CHF"): 0.94,
            ("USD", "GBP"): 0.782,
            ("GBP", "USD"): 1.278,
        }
        rate = fallback_rates.get((from_currency.upper(), to_currency.upper()))
        if rate:
            return rate

        return 1.0

    async def auto_refresh_all_prices(self, db: AsyncSession) -> Dict[str, Any]:
        result = await db.execute(select(Asset))
        assets = result.scalars().all()

        async def refresh_one(asset: Asset) -> Tuple[int, Optional[str]]:
            try:
                asset_type_str = asset.type_value
                price = await self.get_price(asset_type_str, asset.symbol)
                if price is not None:
                    asset.current_price = price
                    await self.save_price_history(db, asset.id, price)
                    return (1, None)
                return (0, f"Could not fetch price for {asset.symbol}")
            except Exception as e:
                return (0, f"Error refreshing {asset.symbol}: {str(e)}")

        results = await asyncio.gather(*[refresh_one(a) for a in assets])
        updated = sum(r[0] for r in results)
        errors = [r[1] for r in results if r[1] is not None]

        await db.commit()
        return {"updated": updated, "errors": errors}

price_service = PriceService()


async def fetch_and_update_exchange_rates() -> Dict[str, float]:
    """Fetch exchange rates from API, cache in Redis, and persist to DB.

    Single source of truth for exchange rate fetching used by both
    the exchange_rates router and portfolio/price services.
    """
    try:
        cached = await cache_service.get(REDIS_KEY_EXCHANGE_RATES)
        if cached:
            return cached
    except Exception as e:
        logging.warning(f"Redis cache miss for exchange rates: {e}")

    rates = None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(EXCHANGE_RATE_API_URL)
            if resp.status_code == 200:
                data = resp.json()
                api_rates = data.get("rates", {})
                rates = {
                    "EUR": 1.0,
                    "USD": api_rates.get("USD", DEFAULT_EXCHANGE_RATES["USD"]),
                    "GBP": api_rates.get("GBP", DEFAULT_EXCHANGE_RATES["GBP"]),
                    "JPY": api_rates.get("JPY", DEFAULT_EXCHANGE_RATES["JPY"]),
                    "CHF": api_rates.get("CHF", DEFAULT_EXCHANGE_RATES["CHF"]),
                }
    except Exception as e:
        logging.warning(f"Exchange rate API failed: {e}")

    if not rates:
        rates = DEFAULT_EXCHANGE_RATES.copy()

    try:
        await cache_service.set(REDIS_KEY_EXCHANGE_RATES, rates, ttl=CACHE_TTL_EXCHANGE)
    except Exception as e:
        logging.warning(f"Redis cache set for exchange rates failed: {e}")

    # Persist to DB
    try:
        from app.database import async_session
        from app.models.exchange_rate import ExchangeRate
        async with async_session() as db:
            for currency, rate in rates.items():
                existing = await db.get(ExchangeRate, currency)
                if existing:
                    existing.rate_vs_usd = rate
                else:
                    db.add(ExchangeRate(currency=currency, rate_vs_usd=rate))
            await db.commit()
    except Exception as e:
        logging.warning(f"DB update for exchange rates failed: {e}")

    return rates


async def get_exchange_rates() -> Dict[str, float]:
    """Public API for exchange rates — delegates to the unified fetcher."""
    return await fetch_and_update_exchange_rates()


async def convert_to_eur(amount: float, currency: str, db: AsyncSession = None) -> float:
    if currency == "EUR" or not currency:
        return amount
    rates = await get_exchange_rates()
    rate = rates.get(currency)
    if rate is None or rate == 0:
        return amount
    return amount / rate
