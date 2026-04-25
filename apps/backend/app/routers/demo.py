from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.database import get_db
from app.models.user import User
from app.models.asset import Asset, AssetType
from app.schemas.assets import AssetResponse
from app.routers.auth import get_current_user
from app.services.price_service import price_service

router = APIRouter()

DEMO_ASSETS = [
    {"type": "crypto", "symbol": "BTC", "quantity": 0.5, "purchase_price": 45000.0},
    {"type": "crypto", "symbol": "ETH", "quantity": 2.0, "purchase_price": 3000.0},
    {"type": "crypto", "symbol": "SOL", "quantity": 50.0, "purchase_price": 100.0},
    {"type": "stocks", "symbol": "AAPL", "quantity": 10.0, "purchase_price": 175.0},
    {"type": "stocks", "symbol": "TSLA", "quantity": 5.0, "purchase_price": 250.0},
    {"type": "stocks", "symbol": "NVDA", "quantity": 3.0, "purchase_price": 500.0},
]

@router.post("/seed", response_model=List[AssetResponse], status_code=status.HTTP_201_CREATED)
async def seed_demo_assets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    created_assets = []

    for demo_asset in DEMO_ASSETS:
        asset_type = AssetType(demo_asset["type"])
        asset_id = str(uuid.uuid4())

        current_price = await price_service.get_price(demo_asset["type"], demo_asset["symbol"])
        if current_price is None:
            current_price = demo_asset["purchase_price"]

        db_asset = Asset(
            id=asset_id,
            user_email=current_user.email,
            type=asset_type,
            symbol=demo_asset["symbol"].upper(),
            quantity=demo_asset["quantity"],
            purchase_price=demo_asset["purchase_price"],
            purchase_price_eur=demo_asset["purchase_price"],
            current_price=current_price
        )
        db.add(db_asset)
        created_assets.append(db_asset)

    await db.commit()

    for asset in created_assets:
        await db.refresh(asset)

    return [
        AssetResponse(
            id=a.id,
            user_email=a.user_email,
            type=a.type_value,
            symbol=a.symbol,
            quantity=a.quantity,
            purchase_price=a.purchase_price,
            purchase_price_eur=a.purchase_price_eur,
            current_price=a.current_price,
            total_value=a.quantity * a.current_price if a.current_price else 0,
            created_at=a.created_at,
        )
        for a in created_assets
    ]