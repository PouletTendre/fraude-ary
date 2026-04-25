from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from typing import List
import uuid

from app.database import get_db
from app.models.user import User
from app.models.alert import PriceAlert, AlertCondition
from app.schemas.alerts import PriceAlertCreate, PriceAlertResponse, PriceAlertUpdate, AlertCountResponse
from app.routers.auth import get_current_user

router = APIRouter()


def _alert_to_response(alert: PriceAlert) -> PriceAlertResponse:
    return PriceAlertResponse(
        id=alert.id,
        user_email=alert.user_email,
        symbol=alert.symbol,
        target_price=alert.target_price,
        condition=alert.condition.value if hasattr(alert.condition, "value") else alert.condition,
        is_active=alert.is_active,
        currency=alert.currency or "EUR",
        created_at=alert.created_at,
    )


@router.post("", response_model=PriceAlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert: PriceAlertCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    alert_id = str(uuid.uuid4())
    db_alert = PriceAlert(
        id=alert_id,
        user_email=current_user.email,
        symbol=alert.symbol.upper(),
        target_price=alert.target_price,
        condition=AlertCondition(alert.condition),
        currency=alert.currency or "EUR",
        is_active=True,
    )
    db.add(db_alert)
    await db.commit()
    await db.refresh(db_alert)
    return _alert_to_response(db_alert)

@router.get("", response_model=List[PriceAlertResponse])
async def list_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PriceAlert).where(PriceAlert.user_email == current_user.email)
    )
    alerts = result.scalars().all()
    return [_alert_to_response(a) for a in alerts]

@router.get("/count", response_model=AlertCountResponse)
async def get_alert_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    total_result = await db.execute(
        select(func.count()).select_from(PriceAlert).where(PriceAlert.user_email == current_user.email)
    )
    total = total_result.scalar() or 0

    active_result = await db.execute(
        select(func.count()).select_from(PriceAlert).where(
            PriceAlert.user_email == current_user.email,
            PriceAlert.is_active == True
        )
    )
    active = active_result.scalar() or 0

    return AlertCountResponse(total=total, active=active)

@router.put("/{alert_id}", response_model=PriceAlertResponse)
async def update_alert(
    alert_id: str,
    alert_update: PriceAlertUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PriceAlert).where(
            PriceAlert.id == alert_id,
            PriceAlert.user_email == current_user.email
        )
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if alert_update.target_price is not None:
        alert.target_price = alert_update.target_price
    if alert_update.condition is not None:
        alert.condition = AlertCondition(alert_update.condition)
    if alert_update.is_active is not None:
        alert.is_active = alert_update.is_active

    await db.commit()
    await db.refresh(alert)

    return _alert_to_response(alert)

@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PriceAlert).where(
            PriceAlert.id == alert_id,
            PriceAlert.user_email == current_user.email
        )
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    await db.delete(alert)
    await db.commit()
