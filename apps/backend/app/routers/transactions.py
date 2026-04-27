from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
import uuid
import logging

from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.asset import Asset, AssetType
from app.schemas.transactions import TransactionCreate, TransactionUpdate, TransactionResponse
from app.routers.auth import get_current_user
from app.services.price_service import price_service

router = APIRouter()


def _tx_to_response(tx: Transaction) -> TransactionResponse:
    return TransactionResponse(
        id=tx.id,
        user_email=tx.user_email,
        asset_id=tx.asset_id,
        type=tx.type_value,
        symbol=tx.symbol,
        quantity=tx.quantity,
        unit_price=tx.unit_price,
        currency=tx.currency,
        exchange_rate=tx.exchange_rate,
        fees=tx.fees,
        total_invested=tx.total_invested,
        date=tx.date,
        created_at=tx.created_at,
    )


@router.get("", response_model=List[TransactionResponse])
async def list_transactions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Transaction).where(Transaction.user_email == current_user.email)
    )
    transactions = result.scalars().all()
    return [_tx_to_response(t) for t in transactions]

@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.transaction import TransactionType
    tx_type = TransactionType(transaction.type)

    tx_date = datetime.strptime(transaction.date, "%Y-%m-%d")
    exchange_rate = await price_service.get_historical_exchange_rate(tx_date, transaction.currency, "EUR")
    total_invested = transaction.quantity * transaction.unit_price * exchange_rate

    tx = Transaction(
        id=str(uuid.uuid4()),
        user_email=current_user.email,
        asset_id=transaction.asset_id,
        type=tx_type,
        symbol=transaction.symbol.upper(),
        quantity=transaction.quantity,
        unit_price=transaction.unit_price,
        currency=transaction.currency,
        exchange_rate=exchange_rate,
        fees=transaction.fees,
        total_invested=total_invested,
        date=tx_date.date()
    )
    db.add(tx)

    # Find associated asset
    asset: Asset | None = None
    if transaction.asset_id:
        result = await db.execute(
            select(Asset).where(Asset.id == transaction.asset_id, Asset.user_email == current_user.email)
        )
        asset = result.scalars().first()
    if not asset and transaction.asset_type:
        result = await db.execute(
            select(Asset).where(
                Asset.user_email == current_user.email,
                Asset.symbol == transaction.symbol.upper(),
                Asset.type == AssetType(transaction.asset_type)
            )
        )
        asset = result.scalars().first()
    if not asset:
        result = await db.execute(
            select(Asset).where(
                Asset.user_email == current_user.email,
                Asset.symbol == transaction.symbol.upper()
            )
        )
        asset = result.scalars().first()

    tx_type_str = transaction.type.lower()
    if tx_type_str == "buy":
        if asset:
            new_quantity = asset.quantity + transaction.quantity
            asset.purchase_price = round(
                (asset.quantity * asset.purchase_price + transaction.quantity * transaction.unit_price) / new_quantity, 2
            )
            eur_cost = transaction.quantity * transaction.unit_price * exchange_rate
            asset.purchase_price_eur = round(
                (asset.quantity * (asset.purchase_price_eur or 0.0) + eur_cost) / new_quantity, 2
            )
            asset.quantity = round(new_quantity, 2)
            tx.asset_id = asset.id
        else:
            if not transaction.asset_type:
                raise HTTPException(status_code=400, detail="asset_type is required when creating a new asset from a BUY transaction")
            asset_type_enum = AssetType(transaction.asset_type)
            current_price = await price_service.get_price(transaction.asset_type, transaction.symbol)
            if current_price is None:
                current_price = transaction.unit_price
            new_asset = Asset(
                id=str(uuid.uuid4()),
                user_email=current_user.email,
                type=asset_type_enum,
                symbol=transaction.symbol.upper(),
                quantity=transaction.quantity,
                purchase_price=transaction.unit_price,
                purchase_price_eur=round(transaction.unit_price * exchange_rate, 2),
                current_price=current_price,
                purchase_date=transaction.date,
                currency=transaction.currency
            )
            db.add(new_asset)
            tx.asset_id = new_asset.id
    elif tx_type_str == "sell":
        if not asset:
            raise HTTPException(status_code=400, detail="Cannot sell an asset that does not exist")
        new_quantity = asset.quantity - transaction.quantity
        if new_quantity <= 0:
            await db.delete(asset)
            tx.asset_id = None
        else:
            asset.quantity = round(new_quantity, 2)
            tx.asset_id = asset.id

    await db.commit()
    await db.refresh(tx)
    return TransactionResponse(
        id=tx.id,
        user_email=tx.user_email,
        asset_id=tx.asset_id,
        type=tx.type_value,
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
    from app.models.transaction import TransactionType

    result = await db.execute(
        select(Transaction).where(
            Transaction.id == tx_id,
            Transaction.user_email == current_user.email
        )
    )
    tx = result.scalars().first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Store old values for delta calculation
    old_type = tx.type_value
    old_symbol = tx.symbol
    old_quantity = tx.quantity
    old_unit_price = tx.unit_price
    old_exchange_rate = tx.exchange_rate
    old_asset_id = tx.asset_id

    if update.asset_id is not None:
        tx.asset_id = update.asset_id
    if update.type is not None:
        tx.type = TransactionType(update.type)
    if update.symbol is not None:
        tx.symbol = update.symbol.upper()
    if update.quantity is not None:
        tx.quantity = update.quantity
    if update.unit_price is not None:
        tx.unit_price = update.unit_price
    if update.currency is not None:
        tx.currency = update.currency
    if update.fees is not None:
        tx.fees = update.fees
    if update.date is not None:
        tx.date = datetime.strptime(update.date, "%Y-%m-%d").date()

    # Recalculate exchange_rate and total_invested server-side if relevant fields changed
    if update.date is not None or update.currency is not None or update.quantity is not None or update.unit_price is not None:
        tx_date = datetime.combine(tx.date, datetime.min.time())
        tx.exchange_rate = await price_service.get_historical_exchange_rate(tx_date, tx.currency, "EUR")
        tx.total_invested = tx.quantity * tx.unit_price * tx.exchange_rate

    new_type = tx.type_value
    new_symbol = tx.symbol
    new_quantity = tx.quantity
    new_unit_price = tx.unit_price
    new_asset_id = tx.asset_id

    # Find the asset affected by the old transaction
    old_asset: Asset | None = None
    if old_asset_id:
        result = await db.execute(
            select(Asset).where(Asset.id == old_asset_id, Asset.user_email == current_user.email)
        )
        old_asset = result.scalars().first()
    if not old_asset:
        result = await db.execute(
            select(Asset).where(
                Asset.user_email == current_user.email,
                Asset.symbol == old_symbol.upper()
            )
        )
        old_asset = result.scalars().first()

    # Undo old transaction effect
    if old_asset:
        if old_type == "buy":
            reverted_quantity = old_asset.quantity - old_quantity
            if reverted_quantity > 0:
                old_asset.purchase_price = round(
                    (old_asset.quantity * old_asset.purchase_price - old_quantity * old_unit_price) / reverted_quantity, 2
                )
                old_asset.purchase_price_eur = round(
                    (old_asset.quantity * (old_asset.purchase_price_eur or 0.0) - old_quantity * old_unit_price * old_exchange_rate) / reverted_quantity, 2
                )
                old_asset.quantity = round(reverted_quantity, 2)
            else:
                old_asset.quantity = round(reverted_quantity, 2)
        else:  # sell
            old_asset.quantity = round(old_asset.quantity + old_quantity, 2)

    # Find target asset for the new transaction
    target_asset: Asset | None = None
    if new_asset_id:
        result = await db.execute(
            select(Asset).where(Asset.id == new_asset_id, Asset.user_email == current_user.email)
        )
        target_asset = result.scalars().first()
    if not target_asset and update.asset_type is not None:
        result = await db.execute(
            select(Asset).where(
                Asset.user_email == current_user.email,
                Asset.symbol == new_symbol.upper(),
                Asset.type == AssetType(update.asset_type)
            )
        )
        target_asset = result.scalars().first()
    if not target_asset:
        result = await db.execute(
            select(Asset).where(
                Asset.user_email == current_user.email,
                Asset.symbol == new_symbol.upper()
            )
        )
        target_asset = result.scalars().first()

    # Apply new transaction effect
    if new_type == "buy":
        if target_asset:
            new_qty = target_asset.quantity + new_quantity
            target_asset.purchase_price = round(
                (target_asset.quantity * target_asset.purchase_price + new_quantity * new_unit_price) / new_qty, 2
            )
            eur_cost = new_quantity * new_unit_price * tx.exchange_rate
            target_asset.purchase_price_eur = round(
                (target_asset.quantity * (target_asset.purchase_price_eur or 0.0) + eur_cost) / new_qty, 2
            )
            target_asset.quantity = round(new_qty, 2)
            tx.asset_id = target_asset.id
        else:
            asset_type_str = update.asset_type if update.asset_type is not None else None
            if not asset_type_str:
                raise HTTPException(status_code=400, detail="asset_type is required when creating a new asset from a BUY transaction")
            asset_type_enum = AssetType(asset_type_str)
            current_price = await price_service.get_price(asset_type_str, new_symbol)
            if current_price is None:
                current_price = new_unit_price
            new_asset = Asset(
                id=str(uuid.uuid4()),
                user_email=current_user.email,
                type=asset_type_enum,
                symbol=new_symbol.upper(),
                quantity=new_quantity,
                purchase_price=new_unit_price,
                purchase_price_eur=round(new_unit_price * tx.exchange_rate, 2),
                current_price=current_price,
                purchase_date=tx.date,
                currency=tx.currency
            )
            db.add(new_asset)
            tx.asset_id = new_asset.id
    else:  # sell
        if not target_asset:
            raise HTTPException(status_code=400, detail="Cannot sell an asset that does not exist")
        new_qty = target_asset.quantity - new_quantity
        if new_qty <= 0:
            target_asset.quantity = round(new_qty, 2)
            tx.asset_id = None
        else:
            target_asset.quantity = round(new_qty, 2)
            tx.asset_id = target_asset.id

    # Cleanup assets with zero or negative quantity
    if old_asset and old_asset.quantity <= 0:
        await db.delete(old_asset)
    if target_asset and target_asset is not old_asset and target_asset.quantity <= 0:
        await db.delete(target_asset)
    # Handle case where old_asset and target_asset are the same object
    if target_asset and target_asset is old_asset and target_asset.quantity <= 0:
        await db.delete(target_asset)

    await db.commit()
    await db.refresh(tx)
    return TransactionResponse(
        id=tx.id,
        user_email=tx.user_email,
        asset_id=tx.asset_id,
        type=tx.type_value,
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
    tx = result.scalars().first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    tx_type = tx.type_value
    tx_quantity = tx.quantity
    tx_symbol = tx.symbol
    tx_asset_id = tx.asset_id

    # Find associated asset and reverse the transaction effect
    asset: Asset | None = None
    if tx_asset_id:
        result = await db.execute(
            select(Asset).where(Asset.id == tx_asset_id, Asset.user_email == current_user.email)
        )
        asset = result.scalars().first()
    if not asset:
        result = await db.execute(
            select(Asset).where(
                Asset.user_email == current_user.email,
                Asset.symbol == tx_symbol.upper()
            )
        )
        asset = result.scalars().first()

    if asset:
        if tx_type == "buy":
            reverted_quantity = asset.quantity - tx_quantity
            if reverted_quantity > 0:
                asset.purchase_price = round(
                    (asset.quantity * asset.purchase_price - tx_quantity * tx.unit_price) / reverted_quantity, 2
                )
                asset.purchase_price_eur = round(
                    (asset.quantity * (asset.purchase_price_eur or 0.0) - tx_quantity * tx.unit_price * tx.exchange_rate) / reverted_quantity, 2
                )
                asset.quantity = round(reverted_quantity, 2)
            else:
                await db.delete(asset)
        else:  # sell
            asset.quantity = round(asset.quantity + tx_quantity, 2)

    await db.delete(tx)
    await db.commit()
