from fastapi import APIRouter, Depends, HTTPException, Query, status, Request, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional
from datetime import datetime
import uuid
import csv
import io
import httpx
import logging

from app.database import get_db
from app.models.user import User
from app.models.asset import Asset, AssetType, PriceHistory
from app.schemas.assets import AssetCreate, AssetUpdate, AssetResponse, PriceRefreshResponse, PriceHistoryEnrichedResponse, OHLCData, AssetImportResponse
from app.routers.auth import get_current_user
from app.services.price_service import price_service

router = APIRouter()

@router.post("/bulk-delete", status_code=status.HTTP_204_NO_CONTENT)
async def bulk_delete_assets(
    asset_ids: List[str],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Asset).where(Asset.id.in_(asset_ids), Asset.user_email == current_user.email)
    )
    assets = result.scalars().all()
    for asset in assets:
        await db.delete(asset)
    await db.commit()

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
            purchase_date=a.purchase_date,
            currency=a.currency or 'USD',
            created_at=a.created_at
        )
        for a in assets
    ]

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
            purchase_date=a.purchase_date,
            currency=a.currency or 'USD',
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
        current_price=current_price,
        purchase_date=asset.purchase_date,
        currency=asset.currency or 'USD'
    )
    db.add(db_asset)
    await db.commit()
    await db.refresh(db_asset)

    # Backfill historical prices from purchase_date
    if db_asset.purchase_date:
        try:
            purchase_dt = datetime.strptime(db_asset.purchase_date, "%Y-%m-%d")
            asset_type_str = asset.type.value if hasattr(asset.type, 'value') else asset.type
            await price_service.backfill_price_history(db, db_asset.id, db_asset.symbol, asset_type_str, purchase_dt)
        except Exception as e:
            logging.warning(f"Failed to backfill history for {db_asset.symbol}: {e}")

    # Create transaction
    from app.models.transaction import Transaction, TransactionType
    tx = Transaction(
        id=str(uuid.uuid4()),
        user_email=current_user.email,
        asset_id=db_asset.id,
        type=TransactionType.BUY,
        symbol=db_asset.symbol,
        quantity=db_asset.quantity,
        unit_price=db_asset.purchase_price,
        currency=asset.currency or 'USD',
        exchange_rate=1.0,
        fees=0.0,
        total_invested=db_asset.quantity * db_asset.purchase_price,
        date=db_asset.purchase_date or datetime.utcnow().strftime("%Y-%m-%d")
    )
    db.add(tx)
    await db.commit()

    return AssetResponse(
        id=db_asset.id,
        user_email=db_asset.user_email,
        type=db_asset.type.value if hasattr(db_asset.type, 'value') else db_asset.type,
        symbol=db_asset.symbol,
        quantity=db_asset.quantity,
        purchase_price=db_asset.purchase_price,
        current_price=db_asset.current_price,
        total_value=db_asset.quantity * db_asset.current_price,
        purchase_date=db_asset.purchase_date,
        currency=db_asset.currency,
        created_at=db_asset.created_at
    )

@router.get("/search/symbols")
async def search_symbols(q: str = Query(..., min_length=1)):
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(
                "https://query1.finance.yahoo.com/v1/finance/search",
                params={"q": q, "quotesCount": 10, "newsCount": 0},
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            )
            resp.raise_for_status()
            data = resp.json()
            quotes = data.get("quotes", [])
            results = []
            for quote in quotes:
                qtype = quote.get("quoteType", "")
                asset_type = "stocks"
                if qtype == "CRYPTOCURRENCY":
                    asset_type = "crypto"
                results.append({
                    "symbol": quote.get("symbol"),
                    "name": quote.get("shortname") or quote.get("longname") or quote.get("symbol"),
                    "type": asset_type,
                    "exchange": quote.get("exchange"),
                })
            return results
    except Exception as e:
        logging.warning(f"Yahoo search failed: {e}")
        return []

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
        purchase_date=db_asset.purchase_date,
        currency=db_asset.currency or 'USD',
        created_at=db_asset.created_at
    )

@router.post("/{asset_id}/backfill-history")
async def backfill_asset_history(
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

    if not asset.purchase_date:
        raise HTTPException(status_code=400, detail="Asset has no purchase_date")

    purchase_dt = datetime.strptime(asset.purchase_date, "%Y-%m-%d")
    asset_type_str = asset.type.value if hasattr(asset.type, 'value') else asset.type
    count = await price_service.backfill_price_history(db, asset.id, asset.symbol, asset_type_str, purchase_dt)
    return {"backfilled_entries": count}

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

@router.post("/refresh-prices", response_model=PriceRefreshResponse)
async def refresh_all_prices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Asset).where(Asset.user_email == current_user.email)
    )
    assets = result.scalars().all()

    prices_updated = 0
    prices = {}
    errors = []

    for asset in assets:
        asset_type_str = asset.type.value if hasattr(asset.type, 'value') else asset.type
        current_price = await price_service.get_price(asset_type_str, asset.symbol)
        if current_price is not None and current_price != asset.current_price:
            asset.current_price = current_price
            prices_updated += 1
            prices[asset.symbol] = current_price
        elif current_price is None and asset.current_price == 0:
            errors.append(f"Could not fetch price for {asset.symbol}")

    await db.commit()

    return PriceRefreshResponse(
        status="success",
        prices_updated=prices_updated,
        prices=prices,
        errors=errors
    )

@router.get("/{asset_id}/history", response_model=PriceHistoryEnrichedResponse)
async def get_asset_history_enriched(
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

    asset_type_str = asset.type.value if hasattr(asset.type, 'value') else asset.type
    current_price = await price_service.get_price(asset_type_str, asset.symbol)
    if current_price is None:
        current_price = asset.current_price

    ohlc = await price_service.get_price_history_ohlc(asset.symbol, asset_type_str)

    history_result = await db.execute(
        select(PriceHistory)
        .where(PriceHistory.asset_id == asset_id)
        .order_by(PriceHistory.timestamp.desc())
        .limit(100)
    )
    history = [
        {
            "price": h.price,
            "timestamp": h.timestamp.isoformat() if h.timestamp else None
        }
        for h in history_result.scalars().all()
    ]

    return PriceHistoryEnrichedResponse(
        asset_id=asset_id,
        symbol=asset.symbol,
        current_price=current_price or 0,
        ohlc=OHLCData(**ohlc) if ohlc else None,
        history=history
    )

@router.post("/import", response_model=AssetImportResponse)
async def import_assets(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    contents = await file.read()
    text = contents.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))

    expected_fields = {"type", "symbol", "quantity", "purchase_price", "purchase_date"}
    if not expected_fields.issubset(set(reader.fieldnames or [])):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must contain columns: {', '.join(expected_fields)}"
        )

    imported_count = 0
    errors = []
    row_num = 1

    for row in reader:
        row_num += 1
        asset_type_str = row.get("type", "").strip().lower()
        symbol = row.get("symbol", "").strip().upper()
        quantity_str = row.get("quantity", "").strip()
        purchase_price_str = row.get("purchase_price", "").strip()
        purchase_date = row.get("purchase_date", "").strip() or None

        if asset_type_str not in ["crypto", "stocks", "real_estate"]:
            errors.append(f"Row {row_num}: invalid type '{asset_type_str}'")
            continue

        try:
            quantity = float(quantity_str)
            if quantity <= 0:
                errors.append(f"Row {row_num}: quantity must be > 0")
                continue
        except ValueError:
            errors.append(f"Row {row_num}: invalid quantity '{quantity_str}'")
            continue

        try:
            purchase_price = float(purchase_price_str)
            if purchase_price < 0:
                errors.append(f"Row {row_num}: purchase_price must be >= 0")
                continue
        except ValueError:
            errors.append(f"Row {row_num}: invalid purchase_price '{purchase_price_str}'")
            continue

        try:
            asset_type = AssetType(asset_type_str)
            current_price = await price_service.get_price(asset_type_str, symbol)
            if current_price is None:
                current_price = purchase_price

            db_asset = Asset(
                id=str(uuid.uuid4()),
                user_email=current_user.email,
                type=asset_type,
                symbol=symbol,
                quantity=quantity,
                purchase_price=purchase_price,
                current_price=current_price,
                purchase_date=purchase_date,
                currency="USD"
            )
            db.add(db_asset)
            imported_count += 1
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")

    if imported_count > 0:
        await db.commit()

    return AssetImportResponse(
        status="success" if not errors else "partial",
        imported_count=imported_count,
        errors=errors
    )