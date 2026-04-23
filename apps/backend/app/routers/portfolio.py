from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

from app.database import get_db
from app.models.user import User
from app.models.asset import Asset, AssetType
from app.schemas.assets import PortfolioSummary, AssetResponse, PerformanceData, AllocationData, ByTypeEntry
from app.routers.auth import get_current_user
from app.services.price_service import price_service

router = APIRouter()

@router.get("/summary", response_model=PortfolioSummary)
async def get_portfolio_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Asset).where(Asset.user_email == current_user.email)
    )
    assets = result.scalars().all()
    asset_responses = []
    crypto_value = 0.0
    stocks_value = 0.0
    real_estate_value = 0.0
    total_value = 0.0
    for asset in assets:
        asset_type_str = asset.type.value if hasattr(asset.type, 'value') else asset.type
        current_price = await price_service.get_price(asset_type_str, asset.symbol)
        if current_price is None:
            current_price = asset.current_price
        else:
            asset.current_price = current_price
        total_asset_value = asset.quantity * current_price
        total_value += total_asset_value
        if asset_type_str == "crypto":
            crypto_value += total_asset_value
        elif asset_type_str == "stocks":
            stocks_value += total_asset_value
        elif asset_type_str == "real_estate":
            real_estate_value += total_asset_value
        asset_responses.append(AssetResponse(
            id=asset.id,
            user_email=asset.user_email,
            type=asset_type_str,
            symbol=asset.symbol,
            quantity=asset.quantity,
            purchase_price=asset.purchase_price,
            current_price=current_price,
            total_value=total_asset_value,
            created_at=asset.created_at
        ))
    daily_perf = 0.0
    monthly_perf = 0.0
    yearly_perf = 0.0
    if total_value > 0:
        total_cost = sum(a.quantity * a.purchase_price for a in assets)
        if total_cost > 0:
            daily_perf = ((total_value - total_cost) / total_cost) * 100
            monthly_perf = daily_perf * 30
            yearly_perf = daily_perf * 365
    allocation = AllocationData(
        crypto=(crypto_value / total_value * 100) if total_value > 0 else 0,
        stocks=(stocks_value / total_value * 100) if total_value > 0 else 0,
        real_estate=(real_estate_value / total_value * 100) if total_value > 0 else 0
    )
    total_gain_loss = total_value - sum(a.quantity * a.purchase_price for a in assets)
    gain_loss_percentage = (total_gain_loss / sum(a.quantity * a.purchase_price for a in assets) * 100) if sum(a.quantity * a.purchase_price for a in assets) > 0 else 0

    by_type = [
        ByTypeEntry(type="crypto", value=crypto_value, percentage=(crypto_value / total_value * 100) if total_value > 0 else 0),
        ByTypeEntry(type="stocks", value=stocks_value, percentage=(stocks_value / total_value * 100) if total_value > 0 else 0),
        ByTypeEntry(type="real_estate", value=real_estate_value, percentage=(real_estate_value / total_value * 100) if total_value > 0 else 0),
    ]

    return PortfolioSummary(
        total_value=total_value,
        total_gain_loss=total_gain_loss,
        gain_loss_percentage=gain_loss_percentage,
        assets=asset_responses,
        performance=PerformanceData(daily=daily_perf, monthly=monthly_perf, yearly=yearly_perf),
        allocation=allocation,
        by_type=by_type
    )