from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional
from datetime import datetime
import uuid

from app.database import get_db
from app.models.user import User
from app.models.asset import Asset, AssetType
from app.schemas.assets import AssetCreate, AssetUpdate, AssetResponse
from app.routers.auth import get_current_user
from app.services.price_service import price_service

router = APIRouter()

@router.get("/{asset_type}", response_model=List[AssetResponse])
async def get_assets(
    asset_type: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if asset_type not in ["crypto", "stocks", "real_estate"]:
        raise HTTPException(status_code=400, detail="Invalid asset type")
    asset_type_enum = AssetType(asset_type)
    result = await db.execute(
        select(Asset).where(
            Asset.user_email == current_user.email,
            Asset.type == asset_type_enum
        )
    )
    assets = result.scalars().all()
    return [
        AssetResponse(
            id=a.id,
            user_email=a.user_email,
            type=a.type.value if hasattr(a.type, 'value') else a.type,
            symbol=a.symbol,
            quantity=a.quantity,
            purchase_price=a.purchase_price,
            current_price=a.current_price,
            total_value=a.quantity * a.current_price if a.current_price else 0,
            created_at=a.created_at
        )
        for a in assets
    ]

@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(
    asset: AssetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    asset_type = AssetType(asset.type)
    asset_id = str(uuid.uuid4())
    current_price = await price_service.get_price(asset.type, asset.symbol)
    if current_price is None:
        current_price = asset.purchase_price
    db_asset = Asset(
        id=asset_id,
        user_email=current_user.email,
        type=asset_type,
        symbol=asset.symbol.upper(),
        quantity=asset.quantity,
        purchase_price=asset.purchase_price,
        current_price=current_price
    )
    db.add(db_asset)
    await db.commit()
    await db.refresh(db_asset)
    return AssetResponse(
        id=db_asset.id,
        user_email=db_asset.user_email,
        type=db_asset.type.value if hasattr(db_asset.type, 'value') else db_asset.type,
        symbol=db_asset.symbol,
        quantity=db_asset.quantity,
        purchase_price=db_asset.purchase_price,
        current_price=db_asset.current_price,
        total_value=db_asset.quantity * db_asset.current_price,
        created_at=db_asset.created_at
    )

@router.get("", response_model=List[AssetResponse])
async def list_all_assets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Asset).where(Asset.user_email == current_user.email)
    )
    assets = result.scalars().all()
    return [
        AssetResponse(
            id=a.id,
            user_email=a.user_email,
            type=a.type.value if hasattr(a.type, 'value') else a.type,
            symbol=a.symbol,
            quantity=a.quantity,
            purchase_price=a.purchase_price,
            current_price=a.current_price,
            total_value=a.quantity * a.current_price if a.current_price else 0,
            created_at=a.created_at
        )
        for a in assets
    ]

@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: str,
    asset_update: AssetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Asset).where(Asset.id == asset_id, Asset.user_email == current_user.email)
    )
    db_asset = result.scalar_one_or_none()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    update_data = asset_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    for field, value in update_data.items():
        setattr(db_asset, field, value)

    await db.commit()
    await db.refresh(db_asset)

    return AssetResponse(
        id=db_asset.id,
        user_email=db_asset.user_email,
        type=db_asset.type.value if hasattr(db_asset.type, 'value') else db_asset.type,
        symbol=db_asset.symbol,
        quantity=db_asset.quantity,
        purchase_price=db_asset.purchase_price,
        current_price=db_asset.current_price,
        total_value=db_asset.quantity * db_asset.current_price if db_asset.current_price else 0,
        created_at=db_asset.created_at
    )

@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    asset_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Asset).where(Asset.id == asset_id, Asset.user_email == current_user.email)
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    await db.delete(asset)
    await db.commit()