import redis.asyncio as redis
import json
from typing import Optional, Any
from app.config import settings

class CacheService:
    def __init__(self):
        self._redis: Optional[redis.Redis] = None

    async def connect(self):
        self._redis = redis.from_url(settings.REDIS_URL, decode_responses=True)

    async def disconnect(self):
        if self._redis:
            await self._redis.close()

    async def get(self, key: str) -> Optional[Any]:
        if not self._redis:
            return None
        value = await self._redis.get(key)
        if value:
            return json.loads(value)
        return None

    async def set(self, key: str, value: Any, ttl: int = 60):
        if not self._redis:
            return
        await self._redis.set(key, json.dumps(value), ex=ttl)

    async def delete(self, key: str):
        if not self._redis:
            return
        await self._redis.delete(key)

    async def get_crypto_price(self, symbol: str) -> Optional[float]:
        key = f"crypto:{symbol.lower()}"
        data = await self.get(key)
        return data.get("price") if data else None

    async def set_crypto_price(self, symbol: str, price: float):
        key = f"crypto:{symbol.lower()}"
        await self.set(key, {"price": price, "symbol": symbol}, ttl=60)

    async def get_stock_price(self, symbol: str) -> Optional[float]:
        key = f"stock:{symbol.upper()}"
        data = await self.get(key)
        return data.get("price") if data else None

    async def set_stock_price(self, symbol: str, price: float):
        key = f"stock:{symbol.upper()}"
        await self.set(key, {"price": price, "symbol": symbol}, ttl=900)

cache_service = CacheService()