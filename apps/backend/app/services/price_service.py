import httpx
import yfinance
from typing import Optional, Dict, List
from app.services.cache_service import cache_service

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
            ticker = yfinance.Ticker(ticker_symbol)
            info = ticker.fast_info
            price = info.get("last_price")
            if price:
                await cache_service.set_stock_price(symbol, price)
            return price
        except Exception:
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