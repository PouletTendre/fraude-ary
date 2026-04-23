import asyncio
import httpx
import logging
import random
import uuid
import yfinance
from typing import Optional, Dict, List
from datetime import datetime
from app.services.cache_service import cache_service
from sqlalchemy.ext.asyncio import AsyncSession

COINGECKO_API = "https://api.coingecko.com/api/v3"

CRYPTO_SYMBOL_MAP = {
    "btc": "bitcoin",
    "eth": "ethereum",
    "usdt": "tether",
    "bnb": "binancecoin",
    "xrp": "ripple",
    "ada": "cardano",
    "doge": "dogecoin",
    "sol": "solana",
    "dot": "polkadot",
    "matic": "matic-network",
}

STOCK_SYMBOL_MAP = {
    "aapl": "AAPL",
    "googl": "GOOGL",
    "msft": "MSFT",
    "amzn": "AMZN",
    "tsla": "TSLA",
    "meta": "META",
    "nvda": "NVDA",
    "gme": "GME",
    "amc": "AMC",
}

STOCK_FALLBACK_PRICES = {
    "aapl": (185, 195),
    "tsla": (170, 250),
    "nvda": (450, 500),
    "googl": (140, 150),
    "msft": (370, 400),
    "amzn": (170, 185),
    "meta": (480, 520),
    "gme": (15, 25),
    "amc": (4, 6),
}

class PriceService:
    async def get_crypto_price(self, symbol: str) -> Optional[float]:
        cached = await cache_service.get_crypto_price(symbol)
        if cached:
            return cached

        coingecko_id = CRYPTO_SYMBOL_MAP.get(symbol.lower())
        if not coingecko_id:
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{COINGECKO_API}/simple/price",
                    params={
                        "ids": coingecko_id,
                        "vs_currencies": "usd"
                    },
                    timeout=10.0
                )
                if response.status_code == 200:
                    data = response.json()
                    price = data.get(coingecko_id, {}).get("usd")
                    if price:
                        await cache_service.set_crypto_price(symbol, price)
                        ohlc = self._generate_ohlc(price)
                        await cache_service.set_price_history(symbol, "crypto", ohlc)
                    return price
        except Exception:
            return None
        return None

    async def get_stock_price(self, symbol: str) -> Optional[float]:
        cached = await cache_service.get_stock_price(symbol)
        if cached:
            return cached

        ticker_symbol = STOCK_SYMBOL_MAP.get(symbol.lower(), symbol.upper())
        try:
            def fetch_price():
                ticker = yfinance.Ticker(ticker_symbol)
                info = ticker.fast_info
                return info.last_price if hasattr(info, 'last_price') else None
            
            price = await asyncio.to_thread(fetch_price)
            if price and price > 0:
                await cache_service.set_stock_price(symbol, price)
                ohlc = self._generate_ohlc(price)
                await cache_service.set_price_history(symbol, "stocks", ohlc)
                return price
            fallback = self._get_fallback_stock_price(symbol)
            if fallback:
                logging.warning(f"Using fallback price for {symbol}: {fallback}")
                await cache_service.set_stock_price(symbol, fallback)
                ohlc = self._generate_ohlc(fallback)
                await cache_service.set_price_history(symbol, "stocks", ohlc)
                return fallback
            return None
        except Exception as e:
            logging.warning(f"Failed to fetch stock price for {symbol}: {e}")
            fallback = self._get_fallback_stock_price(symbol)
            if fallback:
                logging.warning(f"Using fallback price for {symbol}: {fallback}")
                await cache_service.set_stock_price(symbol, fallback)
                ohlc = self._generate_ohlc(fallback)
                await cache_service.set_price_history(symbol, "stocks", ohlc)
                return fallback
            return None

    def _get_fallback_stock_price(self, symbol: str) -> Optional[float]:
        symbol_lower = symbol.lower()
        if symbol_lower in STOCK_FALLBACK_PRICES:
            min_price, max_price = STOCK_FALLBACK_PRICES[symbol_lower]
            return round(random.uniform(min_price, max_price), 2)
        return None

    def _generate_ohlc(self, price: float) -> Dict:
        variation = price * random.uniform(0.001, 0.02)
        open_price = round(price - variation, 2)
        high_price = round(price + variation * random.uniform(0.5, 1.5), 2)
        low_price = round(price - variation * random.uniform(0.5, 1.5), 2)
        close_price = round(price + random.uniform(-variation, variation), 2)
        return {
            "open": open_price,
            "high": high_price,
            "low": low_price,
            "close": close_price,
            "timestamp": datetime.utcnow().isoformat()
        }

    async def get_price_history_ohlc(self, symbol: str, asset_type: str) -> Optional[Dict]:
        cached = await cache_service.get_price_history(symbol, asset_type)
        if cached:
            return cached
        price = await self.get_price(asset_type, symbol)
        if price:
            ohlc = self._generate_ohlc(price)
            await cache_service.set_price_history(symbol, asset_type, ohlc)
            return ohlc
        return None

    async def get_real_estate_price(self, symbol: str) -> Optional[float]:
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
        symbol_upper = symbol.upper()
        for crypto_key in CRYPTO_SYMBOL_MAP:
            if symbol_upper == crypto_key.upper():
                return await self.get_crypto_price(symbol)
        for stock_key in STOCK_SYMBOL_MAP:
            if symbol_upper == stock_key.upper():
                return await self.get_stock_price(symbol)
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

price_service = PriceService()