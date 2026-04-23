from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List
import uuid

from app.database import get_db
from app.models.user import User
from app.models.alert import PriceAlert, AlertCondition
from app.schemas.alerts import PriceAlertCreate, PriceAlertResponse
from app.routers.auth import get_current_user

router = APIRouter()

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
        is_active=True,
    )
    db.add(db_alert)
    await db.commit()
    await db.refresh(db_alert)
    return PriceAlertResponse(
        id=db_alert.id,
        user_email=db_alert.user_email,
        symbol=db_alert.symbol,
        target_price=db_alert.target_price,
        condition=db_alert.condition.value if hasattr(db_alert.condition, 'value') else db_alert.condition,
        is_active=db_alert.is_active,
        created_at=db_alert.created_at,
    )

@router.get("", response_model=List[PriceAlertResponse])
async def list_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PriceAlert).where(PriceAlert.user_email == current_user.email)
    )
    alerts = result.scalars().all()
    return [
        PriceAlertResponse(
            id=a.id,
            user_email=a.user_email,
            symbol=a.symbol,
            target_price=a.target_price,
            condition=a.condition.value if hasattr(a.condition, 'value') else a.condition,
            is_active=a.is_active,
            created_at=a.created_at,
        )
        for a in alerts
    ]

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
