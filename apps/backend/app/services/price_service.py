import asyncio
import httpx
import logging
import uuid
from typing import Optional, Dict, List, Any
from datetime import datetime
from app.services.cache_service import cache_service
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

CRYPTO_COMPARE_API = "https://min-api.cryptocompare.com/data"
YAHOO_CHART_API = "https://query1.finance.yahoo.com/v8/finance/chart"

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

        # Fallback to yfinance if HTTP API fails
        try:
            import yfinance
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
        from app.models.asset import PriceHistory
        history_entry = PriceHistory(
            id=str(uuid.uuid4()),
            asset_id=asset_id,
            price=price,
            timestamp=datetime.utcnow()
        )
        db.add(history_entry)

    async def get_current_price(self, symbol: str) -> Optional[float]:
        price = await self.get_crypto_price(symbol)
        if price:
            return price
        return await self.get_stock_price(symbol)

    async def refresh_crypto_prices(self, symbols: List[str]) -> Dict[str, float]:
        results = {}
        for symbol in symbols:
            price = await self.get_crypto_price(symbol)
            if price:
                results[symbol] = price
        return results

    async def refresh_stock_prices(self, symbols: List[str]) -> Dict[str, float]:
        results = {}
        for symbol in symbols:
            price = await self.get_stock_price(symbol)
            if price:
                results[symbol] = price
        return results

    async def get_benchmark_data(self, symbol: str, period: str = "1y") -> Optional[Dict]:
        try:
            def fetch_history():
                import yfinance
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

    async def auto_refresh_all_prices(self, db: AsyncSession) -> Dict[str, Any]:
        from app.models.asset import Asset
        result = await db.execute(select(Asset))
        assets = result.scalars().all()

        updated = 0
        errors = []
        for asset in assets:
            try:
                asset_type_str = asset.type.value if hasattr(asset.type, 'value') else asset.type
                price = await self.get_price(asset_type_str, asset.symbol)
                if price is not None:
                    asset.current_price = price
                    await self.save_price_history(db, asset.id, price)
                    updated += 1
                else:
                    errors.append(f"Could not fetch price for {asset.symbol}")
            except Exception as e:
                errors.append(f"Error refreshing {asset.symbol}: {str(e)}")

        await db.commit()
        return {"updated": updated, "errors": errors}

price_service = PriceService()
