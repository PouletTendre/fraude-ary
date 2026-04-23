import random
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.exchange_rate import ExchangeRate
from app.schemas.exchange_rates import ExchangeRateResponse, ExchangeRatesListResponse

router = APIRouter()

DEFAULT_RATES = {
    "USD": 1.0,
    "EUR": 0.92,
    "GBP": 0.79,
    "JPY": 150.0,
    "CHF": 0.88,
}


async def _seed_rates(db: AsyncSession):
    for currency, rate in DEFAULT_RATES.items():
        existing = await db.get(ExchangeRate, currency)
        if not existing:
            db.add(ExchangeRate(currency=currency, rate_vs_usd=rate))
    await db.commit()


@router.get("", response_model=ExchangeRatesListResponse)
async def get_exchange_rates(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ExchangeRate))
    rates = result.scalars().all()
    if not rates:
        await _seed_rates(db)
        result = await db.execute(select(ExchangeRate))
        rates = result.scalars().all()

    return ExchangeRatesListResponse(
        base_currency="USD",
        rates=[
            ExchangeRateResponse(
                currency=r.currency,
                rate_vs_usd=round(r.rate_vs_usd * (1 + random.uniform(-0.005, 0.005)), 6),
                updated_at=r.updated_at,
            )
            for r in rates
        ],
    )
