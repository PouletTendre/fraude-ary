from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.alert import Notification
from app.schemas.notifications import NotificationResponse
from app.routers.auth import get_current_user

router = APIRouter()


def _notification_to_response(n: Notification) -> NotificationResponse:
    return NotificationResponse(
        id=n.id,
        user_email=n.user_email,
        message=n.message,
        title=n.message[:50] if len(n.message) > 50 else n.message,
        type="info",
        read=n.is_read,
        created_at=n.created_at,
    )


@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Notification)
        .where(
            Notification.user_email == current_user.email,
            Notification.is_read == False
        )
        .order_by(Notification.created_at.desc())
    )
    notifications = result.scalars().all()
    return [_notification_to_response(n) for n in notifications]

@router.post("/read-all")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        update(Notification)
        .where(
            Notification.user_email == current_user.email,
            Notification.is_read == False
        )
        .values(is_read=True)
    )
    await db.commit()
    return {"updated": result.rowcount}

@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_email == current_user.email
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    await db.commit()
    await db.refresh(notification)

    return _notification_to_response(notification)
