from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import csv
import io
import json

from app.database import get_db
from app.models.user import User
from app.models.asset import Asset, AssetType, PriceHistory
from app.models.alert import PortfolioSnapshot
from app.schemas.assets import PortfolioSummary, AssetResponse, PerformanceData, AllocationData, ByTypeEntry, PortfolioStatistics, HistoryPoint
from app.schemas.alerts import PortfolioHistoryEntry, PortfolioHistoryResponse
from app.routers.auth import get_current_user
from app.services.price_service import price_service

router = APIRouter()

async def _get_portfolio_history(
    user_email: str,
    db: AsyncSession,
    start_date: datetime
) -> List[PortfolioHistoryEntry]:
    snapshot_result = await db.execute(
        select(PortfolioSnapshot)
        .where(
            PortfolioSnapshot.user_email == user_email,
            PortfolioSnapshot.date >= start_date
        )
        .order_by(PortfolioSnapshot.date.asc())
    )
    snapshots = snapshot_result.scalars().all()

    if snapshots:
        return [
            PortfolioHistoryEntry(date=s.date, total_value=s.total_value)
            for s in snapshots
        ]

    # Fallback: compute from price_history
    asset_result = await db.execute(
        select(Asset).where(Asset.user_email == user_email)
    )
    assets = asset_result.scalars().all()

    if not assets:
        return []

    asset_ids = [a.id for a in assets]
    history_result = await db.execute(
        select(PriceHistory)
        .where(
            PriceHistory.asset_id.in_(asset_ids),
            PriceHistory.timestamp >= start_date
        )
        .order_by(PriceHistory.timestamp.asc())
    )
    price_history_entries = history_result.scalars().all()

    from collections import defaultdict
    daily_values = defaultdict(float)
    asset_map = {a.id: a for a in assets}

    for entry in price_history_entries:
        asset = asset_map.get(entry.asset_id)
        if asset:
            day = entry.timestamp.date()
            daily_values[day] += asset.quantity * entry.price

    # Add current portfolio value for today if missing
    total_current = 0.0
    for asset in assets:
        asset_type_str = asset.type.value if hasattr(asset.type, 'value') else asset.type
        current_price = await price_service.get_price(asset_type_str, asset.symbol)
        if current_price is None:
            current_price = asset.current_price
        total_current += asset.quantity * current_price

    today = datetime.utcnow().date()
    if today not in daily_values and total_current > 0:
        daily_values[today] = total_current

    return [
        PortfolioHistoryEntry(
            date=datetime.combine(day, datetime.min.time()),
            total_value=value
        )
        for day, value in sorted(daily_values.items())
    ]

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
    # Compute history for the last 365 days to support yearly performance
    year_ago = datetime.utcnow() - timedelta(days=365)
    history_entries = await _get_portfolio_history(current_user.email, db, year_ago)

    history_points = [
        HistoryPoint(date=entry.date.isoformat(), value=entry.total_value)
        for entry in history_entries
    ]

    # Calculate performance using historical data
    daily_perf = 0.0
    monthly_perf = 0.0
    yearly_perf = 0.0

    if total_value > 0 and history_entries:
        now = datetime.utcnow()
        today = now.date()
        yesterday = today - timedelta(days=1)
        month_ago = now - timedelta(days=30)
        year_ago_dt = now - timedelta(days=365)

        yesterday_value = None
        month_ago_value = None
        year_ago_value = None

        for entry in reversed(history_entries):
            entry_date = entry.date.date() if hasattr(entry.date, 'date') else entry.date
            if yesterday_value is None and entry_date <= yesterday:
                yesterday_value = entry.total_value
            if month_ago_value is None and entry.date <= month_ago:
                month_ago_value = entry.total_value
            if year_ago_value is None and entry.date <= year_ago_dt:
                year_ago_value = entry.total_value
            if yesterday_value is not None and month_ago_value is not None and year_ago_value is not None:
                break

        def calc_perf(current: float, past: Optional[float]) -> float:
            if past is not None and past > 0:
                return ((current - past) / past) * 100
            return 0.0

        daily_perf = calc_perf(total_value, yesterday_value)
        monthly_perf = calc_perf(total_value, month_ago_value)
        yearly_perf = calc_perf(total_value, year_ago_value)

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
        by_type=by_type,
        history=history_points
    )

@router.get("/history", response_model=PortfolioHistoryResponse)
async def get_portfolio_history(
    period: str = Query("1m", pattern="^(1w|1m|3m|1y)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.utcnow()
    if period == "1w":
        start_date = now - timedelta(weeks=1)
    elif period == "1m":
        start_date = now - timedelta(days=30)
    elif period == "3m":
        start_date = now - timedelta(days=90)
    elif period == "1y":
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=30)

    history = await _get_portfolio_history(current_user.email, db, start_date)
    return PortfolioHistoryResponse(period=period, history=history)

@router.get("/statistics", response_model=PortfolioStatistics)
async def get_portfolio_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Asset).where(Asset.user_email == current_user.email)
    )
    assets = result.scalars().all()

    if not assets:
        return PortfolioStatistics(
            best_asset=None,
            worst_asset=None,
            portfolio_volatility=0.0,
            performance_vs_market=0.0,
            total_return=0.0,
            sharpe_ratio=None
        )

    asset_performances = []
    total_value = 0.0
    total_cost = 0.0

    for asset in assets:
        asset_type_str = asset.type.value if hasattr(asset.type, 'value') else asset.type
        current_price = await price_service.get_price(asset_type_str, asset.symbol)
        if current_price is None:
            current_price = asset.current_price
        current_value = asset.quantity * current_price
        cost_basis = asset.quantity * asset.purchase_price
        total_value += current_value
        total_cost += cost_basis
        return_amount = current_value - cost_basis
        return_pct = (return_amount / cost_basis * 100) if cost_basis > 0 else 0
        weight = (current_value / total_value * 100) if total_value > 0 else 0
        asset_performances.append({
            "symbol": asset.symbol,
            "asset_type": asset_type_str,
            "quantity": asset.quantity,
            "purchase_price": asset.purchase_price,
            "current_price": current_price,
            "return_amount": return_amount,
            "return_percentage": return_pct,
            "weight": weight
        })

    best_asset = max(asset_performances, key=lambda x: x["return_percentage"]) if asset_performances else None
    worst_asset = min(asset_performances, key=lambda x: x["return_percentage"]) if asset_performances else None

    total_return = ((total_value - total_cost) / total_cost * 100) if total_cost > 0 else 0

    returns = [p["return_percentage"] for p in asset_performances]
    if len(returns) > 1:
        mean_return = sum(returns) / len(returns)
        variance = sum((r - mean_return) ** 2 for r in returns) / len(returns)
        volatility = variance ** 0.5
    else:
        volatility = 0.0

    market_benchmark_return = 10.0
    performance_vs_market = total_return - market_benchmark_return

    returns_for_sharpe = [r / 100 for r in returns if r != 0]
    sharpe_ratio = None
    if len(returns_for_sharpe) > 1 and volatility > 0:
        mean_ret = sum(returns_for_sharpe) / len(returns_for_sharpe)
        sharpe_ratio = round(mean_ret / (volatility / 100), 2) if volatility != 0 else None

    return PortfolioStatistics(
        best_asset=best_asset,
        worst_asset=worst_asset,
        portfolio_volatility=round(volatility, 2),
        performance_vs_market=round(performance_vs_market, 2),
        total_return=round(total_return, 2),
        sharpe_ratio=sharpe_ratio
    )

@router.get("/export")
async def export_portfolio(
    format: str = Query("csv", regex="^(csv|json)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Asset).where(Asset.user_email == current_user.email)
    )
    assets = result.scalars().all()

    portfolio_data = []
    for asset in assets:
        asset_type_str = asset.type.value if hasattr(asset.type, 'value') else asset.type
        current_price = await price_service.get_price(asset_type_str, asset.symbol)
        if current_price is None:
            current_price = asset.current_price
        current_value = asset.quantity * current_price
        cost_basis = asset.quantity * asset.purchase_price
        portfolio_data.append({
            "id": asset.id,
            "type": asset_type_str,
            "symbol": asset.symbol,
            "quantity": asset.quantity,
            "purchase_price": asset.purchase_price,
            "current_price": current_price,
            "current_value": current_value,
            "cost_basis": cost_basis,
            "gain_loss": current_value - cost_basis,
            "gain_loss_percentage": ((current_value - cost_basis) / cost_basis * 100) if cost_basis > 0 else 0,
            "created_at": asset.created_at.isoformat() if asset.created_at else None
        })

    if format == "csv":
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=["id", "type", "symbol", "quantity", "purchase_price", "current_price", "current_value", "cost_basis", "gain_loss", "gain_loss_percentage", "created_at"])
        writer.writeheader()
        writer.writerows(portfolio_data)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=portfolio_export.csv"}
        )
    else:
        return StreamingResponse(
            iter([json.dumps(portfolio_data, indent=2)]),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=portfolio_export.json"}
        )