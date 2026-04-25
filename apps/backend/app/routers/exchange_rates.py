import httpx
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.exchange_rate import ExchangeRate
from app.schemas.exchange_rates import ExchangeRateResponse, ExchangeRatesListResponse
from app.services.cache_service import cache_service
from app.routers.auth import get_current_user

router = APIRouter()

DEFAULT_RATES = {
    "EUR": 1.0,
    "USD": 1.087,
    "GBP": 0.85,
    "JPY": 162.0,
    "CHF": 0.95,
}

EXCHANGE_RATE_API_URL = "https://api.frankfurter.app/latest?from=EUR"
REDIS_KEY = "exchange_rates"
CACHE_TTL = 3600


async def _seed_rates(db: AsyncSession, rates: dict):
    for currency, rate in rates.items():
        existing = await db.get(ExchangeRate, currency)
        if existing:
            existing.rate_vs_usd = rate
        else:
            db.add(ExchangeRate(currency=currency, rate_vs_usd=rate))
    await db.commit()


async def fetch_and_update_rates() -> dict:
    try:
        cached = await cache_service.get(REDIS_KEY)
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
                    "USD": api_rates.get("USD", DEFAULT_RATES["USD"]),
                    "GBP": api_rates.get("GBP", DEFAULT_RATES["GBP"]),
                    "JPY": api_rates.get("JPY", DEFAULT_RATES["JPY"]),
                    "CHF": api_rates.get("CHF", DEFAULT_RATES["CHF"]),
                }
    except Exception as e:
        logging.warning(f"Exchange rate API failed: {e}")

    if not rates:
        rates = DEFAULT_RATES.copy()

    try:
        await cache_service.set(REDIS_KEY, rates, ttl=CACHE_TTL)
    except Exception as e:
        logging.warning(f"Redis cache set for exchange rates failed: {e}")

    try:
        from app.database import async_session
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


@router.get("", response_model=ExchangeRatesListResponse)
async def get_exchange_rates(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    rates = await fetch_and_update_rates()

    result = await db.execute(select(ExchangeRate))
    db_rates = result.scalars().all()
    if not db_rates:
        await _seed_rates(db, rates)
        result = await db.execute(select(ExchangeRate))
        db_rates = result.scalars().all()

    return ExchangeRatesListResponse(
        base_currency="EUR",
        rates=[
            ExchangeRateResponse(
                currency=r.currency,
                rate_vs_usd=r.rate_vs_usd,
                updated_at=r.updated_at,
            )
            for r in db_rates
        ],
    )
