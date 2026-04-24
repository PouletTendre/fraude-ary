from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transactions import TransactionCreate, TransactionUpdate, TransactionResponse
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

@router.put("/{tx_id}", response_model=TransactionResponse)
async def update_transaction(
    tx_id: str,
    update: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == tx_id,
            Transaction.user_email == current_user.email
        )
    )
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if update.asset_id is not None:
        tx.asset_id = update.asset_id
    if update.type is not None:
        from app.models.transaction import TransactionType
        tx.type = TransactionType(update.type)
    if update.symbol is not None:
        tx.symbol = update.symbol.upper()
    if update.quantity is not None:
        tx.quantity = update.quantity
    if update.unit_price is not None:
        tx.unit_price = update.unit_price
    if update.currency is not None:
        tx.currency = update.currency
    if update.exchange_rate is not None:
        tx.exchange_rate = update.exchange_rate
    if update.fees is not None:
        tx.fees = update.fees
    if update.total_invested is not None:
        tx.total_invested = update.total_invested
    if update.date is not None:
        tx.date = update.date
    
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

@router.delete("/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    tx_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == tx_id,
            Transaction.user_email == current_user.email
        )
    )
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    await db.delete(tx)
    await db.commit()
