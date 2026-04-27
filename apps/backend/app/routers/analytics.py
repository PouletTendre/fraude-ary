import asyncio
import logging
from typing import List

import yfinance

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.asset import Asset
from app.routers.auth import get_current_user
from app.schemas.technical import PortfolioAnalyticsRequest, PortfolioAnalyticsResponse
from app.services.portfolio_analytics_service import calculate_portfolio_metrics

router = APIRouter(prefix="/portfolio", tags=["portfolio-analytics"])


def _fetch_price_history(symbol: str, asset_type: str, period: str = "6mo") -> List[float]:
    try:
        ticker = yfinance.Ticker(symbol.upper())
        hist = ticker.history(period=period)
        if hist.empty:
            return []
        return hist["Close"].tolist()
    except Exception as e:
        logging.warning(f"Failed history for {symbol}: {e}")
        return []


@router.post("/analytics", response_model=PortfolioAnalyticsResponse)
async def get_portfolio_analytics(
    body: PortfolioAnalyticsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not body.asset_ids:
        return PortfolioAnalyticsResponse(
            total_value=0.0,
        )

    result = await db.execute(
        select(Asset).where(
            Asset.id.in_(body.asset_ids),
            Asset.user_email == current_user.email,
        )
    )
    assets = result.scalars().all()
    if not assets:
        raise HTTPException(status_code=404, detail="No assets found")

    holdings = []
    price_histories = []

    for asset in assets:
        holdings.append({
            "symbol": asset.symbol,
            "quantity": asset.quantity,
            "current_price": asset.current_price or asset.purchase_price,
            "type": asset.type_value,
        })

    for asset in assets:
        hist = await asyncio.to_thread(
            _fetch_price_history, asset.symbol, asset.type_value, "6mo"
        )
        price_histories.append(hist if hist else [asset.current_price or asset.purchase_price])

    metrics = calculate_portfolio_metrics(holdings, price_histories)

    return PortfolioAnalyticsResponse(**metrics)


@router.get("/analytics/summary", response_model=PortfolioAnalyticsResponse)
async def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Asset).where(Asset.user_email == current_user.email)
    )
    assets = result.scalars().all()
    if not assets:
        return PortfolioAnalyticsResponse(total_value=0.0)

    holdings = []
    price_histories = []

    for asset in assets:
        holdings.append({
            "symbol": asset.symbol,
            "quantity": asset.quantity,
            "current_price": asset.current_price or asset.purchase_price,
            "type": asset.type_value,
        })

    for asset in assets:
        hist = await asyncio.to_thread(
            _fetch_price_history, asset.symbol, asset.type_value, "6mo"
        )
        price_histories.append(hist if hist else [asset.current_price or asset.purchase_price])

    metrics = calculate_portfolio_metrics(holdings, price_histories)
    return PortfolioAnalyticsResponse(**metrics)
