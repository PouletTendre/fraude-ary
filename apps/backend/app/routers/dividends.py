import uuid
import logging
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sql_func
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.dividend import Dividend
from app.models.asset import Asset
from app.schemas.dividends import DividendCreate, DividendUpdate, DividendResponse, DividendSummary
from app.routers.auth import get_current_user

router = APIRouter()


def _dividend_to_response(d: Dividend) -> DividendResponse:
    date_str = d.date.isoformat() if hasattr(d.date, 'isoformat') else str(d.date) if d.date else None
    return DividendResponse(
        id=d.id,
        user_email=d.user_email,
        symbol=d.symbol,
        amount_per_share=d.amount_per_share,
        quantity=d.quantity,
        total_amount=d.total_amount,
        currency=d.currency or "EUR",
        date=date_str,
        created_at=d.created_at,
    )


@router.get("", response_model=List[DividendResponse])
async def list_dividends(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Dividend)
        .where(Dividend.user_email == current_user.email)
        .order_by(Dividend.date.desc())
    )
    return [_dividend_to_response(d) for d in result.scalars().all()]


@router.get("/summary", response_model=DividendSummary)
async def get_dividend_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Dividend).where(Dividend.user_email == current_user.email)
    )
    dividends = result.scalars().all()

    total = sum(d.total_amount for d in dividends)
    by_symbol = defaultdict(float)
    monthly = defaultdict(float)
    for d in dividends:
        by_symbol[d.symbol] += d.total_amount
        month_key = d.date.isoformat()[:7] if hasattr(d.date, 'isoformat') else str(d.date)[:7]
        monthly[month_key] += d.total_amount

    monthly_history = [
        {"month": k, "amount": round(v, 2)} for k, v in sorted(monthly.items())
    ]

    yield_on_cost = 0.0
    assets_result = await db.execute(
        select(Asset).where(
            Asset.user_email == current_user.email, Asset.type == "stocks"
        )
    )
    assets = assets_result.scalars().all()
    total_cost = sum(a.quantity * a.purchase_price for a in assets)
    if total_cost > 0 and dividends:
        annualized = 0.0
        for d in dividends:
            for a in assets:
                if a.symbol == d.symbol:
                    annualized += d.amount_per_share * a.quantity
                    break
        yield_on_cost = round((annualized / total_cost) * 100, 2)

    return DividendSummary(
        total_dividends=round(total, 2),
        total_by_symbol={k: round(v, 2) for k, v in by_symbol.items()},
        monthly_history=monthly_history,
        yield_on_cost=yield_on_cost,
        count=len(dividends),
    )


@router.post("", response_model=DividendResponse, status_code=status.HTTP_201_CREATED)
async def create_dividend(
    dividend: DividendCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dividend_id = str(uuid.uuid4())
    total_amount = round(dividend.amount_per_share * dividend.quantity, 2)
    db_dividend = Dividend(
        id=dividend_id,
        user_email=current_user.email,
        symbol=dividend.symbol.upper(),
        amount_per_share=dividend.amount_per_share,
        quantity=dividend.quantity,
        total_amount=total_amount,
        currency=dividend.currency,
        date=dividend.date,
    )
    db.add(db_dividend)
    await db.commit()
    await db.refresh(db_dividend)
    logging.info(
        f"[DIVIDEND] Created: {db_dividend.symbol} {db_dividend.total_amount} "
        f"{db_dividend.currency} for {current_user.email}"
    )
    return _dividend_to_response(db_dividend)


@router.put("/{dividend_id}", response_model=DividendResponse)
async def update_dividend(
    dividend_id: str,
    dividend_update: DividendUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Dividend).where(
            Dividend.id == dividend_id, Dividend.user_email == current_user.email
        )
    )
    db_dividend = result.scalars().first()
    if not db_dividend:
        raise HTTPException(status_code=404, detail="Dividend not found")

    update_data = dividend_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_dividend, field, value)

    if "amount_per_share" in update_data or "quantity" in update_data:
        db_dividend.total_amount = round(
            db_dividend.amount_per_share * db_dividend.quantity, 2
        )

    await db.commit()
    await db.refresh(db_dividend)
    return _dividend_to_response(db_dividend)


@router.delete("/{dividend_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dividend(
    dividend_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Dividend).where(
            Dividend.id == dividend_id, Dividend.user_email == current_user.email
        )
    )
    dividend = result.scalars().first()
    if not dividend:
        raise HTTPException(status_code=404, detail="Dividend not found")
    await db.delete(dividend)
    await db.commit()
