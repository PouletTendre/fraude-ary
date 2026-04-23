from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.asset import Asset
from app.schemas.assets import PriceRefreshResponse
from app.routers.auth import get_current_user
from app.services.price_service import price_service

router = APIRouter()

@router.post("/refresh", response_model=PriceRefreshResponse)
async def refresh_prices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Asset).where(Asset.user_email == current_user.email)
    )
    assets = result.scalars().all()
    errors = []
    prices_updated = 0
    crypto_symbols = set()
    stock_symbols = set()
    for asset in assets:
        asset_type_str = asset.type.value if hasattr(asset.type, 'value') else asset.type
        if asset_type_str == "crypto":
            crypto_symbols.add(asset.symbol.lower())
        elif asset_type_str == "stocks":
            stock_symbols.add(asset.symbol.upper())
    if crypto_symbols:
        crypto_prices = await price_service.refresh_crypto_prices(list(crypto_symbols))
        for symbol, price in crypto_prices.items():
            await db.execute(
                update(Asset)
                .where(Asset.user_email == current_user.email, Asset.symbol == symbol.upper())
                .values(current_price=price)
            )
            prices_updated += 1
    if stock_symbols:
        stock_prices = await price_service.refresh_stock_prices(list(stock_symbols))
        for symbol, price in stock_prices.items():
            await db.execute(
                update(Asset)
                .where(Asset.user_email == current_user.email, Asset.symbol == symbol.upper())
                .values(current_price=price)
            )
            prices_updated += 1
    await db.commit()
    return PriceRefreshResponse(
        status="ok",
        prices_updated=prices_updated,
        errors=errors
    )