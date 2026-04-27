import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.exchange_rate import ExchangeRate
from app.schemas.exchange_rates import ExchangeRateResponse, ExchangeRatesListResponse
from app.services.price_service import fetch_and_update_exchange_rates, DEFAULT_EXCHANGE_RATES
from app.routers.auth import get_current_user

router = APIRouter()


async def _seed_rates(db: AsyncSession, rates: dict):
    for currency, rate in rates.items():
        existing = await db.get(ExchangeRate, currency)
        if existing:
            existing.rate_vs_usd = rate
        else:
            db.add(ExchangeRate(currency=currency, rate_vs_usd=rate))
    await db.commit()


@router.get("", response_model=ExchangeRatesListResponse)
async def get_exchange_rates(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    rates = await fetch_and_update_exchange_rates()

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
