from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transactions import TransactionCreate, TransactionResponse
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("", response_model=List[TransactionResponse])
async def list_transactions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Transaction).where(Transaction.user_email == current_user.email)
    )
    transactions = result.scalars().all()
    return [
        TransactionResponse(
            id=t.id,
            user_email=t.user_email,
            asset_id=t.asset_id,
            type=t.type.value if hasattr(t.type, 'value') else t.type,
            symbol=t.symbol,
            quantity=t.quantity,
            unit_price=t.unit_price,
            currency=t.currency,
            exchange_rate=t.exchange_rate,
            fees=t.fees,
            total_invested=t.total_invested,
            date=t.date,
            created_at=t.created_at
        )
        for t in transactions
    ]

@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.transaction import TransactionType
    tx_type = TransactionType(transaction.type)
    tx = Transaction(
        id=str(uuid.uuid4()),
        user_email=current_user.email,
        asset_id=transaction.asset_id,
        type=tx_type,
        symbol=transaction.symbol,
        quantity=transaction.quantity,
        unit_price=transaction.unit_price,
        currency=transaction.currency,
        exchange_rate=transaction.exchange_rate,
        fees=transaction.fees,
        total_invested=transaction.total_invested,
        date=transaction.date
    )
    db.add(tx)
    await db.commit()
    await db.refresh(tx)
    return TransactionResponse(
        id=tx.id,
        user_email=tx.user_email,
        asset_id=tx.asset_id,
        type=tx.type.value if hasattr(tx.type, 'value') else tx.type,
        symbol=tx.symbol,
        quantity=tx.quantity,
        unit_price=tx.unit_price,
        currency=tx.currency,
        exchange_rate=tx.exchange_rate,
        fees=tx.fees,
        total_invested=tx.total_invested,
        date=tx.date,
        created_at=tx.created_at
    )
