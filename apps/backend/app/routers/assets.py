from fastapi import APIRouter, Depends, HTTPException, Query, status, Request, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from typing import List, Optional, DefaultDict, Tuple
from datetime import datetime, timezone, date
import uuid
import csv
import io
from collections import defaultdict
import httpx
import logging

from app.database import get_db
from app.models.user import User
from app.models.asset import Asset, AssetType, PriceHistory
from app.models.transaction import Transaction, TransactionType
from app.schemas.assets import AssetCreate, AssetUpdate, AssetResponse, PriceRefreshResponse, PriceHistoryEnrichedResponse, OHLCData, AssetImportResponse
from app.schemas.pagination import PaginatedResponse
from app.routers.auth import get_current_user
from app.services.price_service import price_service

router = APIRouter()


def _asset_to_response(asset: Asset) -> AssetResponse:
    pd = asset.purchase_date
    purchase_date_str = pd.isoformat() if hasattr(pd, 'isoformat') else str(pd) if pd else None
    return AssetResponse(
        id=asset.id,
        user_email=asset.user_email,
        type=asset.type_value,
        symbol=asset.symbol,
        quantity=asset.quantity,
        purchase_price=asset.purchase_price,
        purchase_price_eur=asset.purchase_price_eur,
        current_price=asset.current_price,
        total_value=asset.quantity * asset.current_price if asset.current_price else 0,
        purchase_date=purchase_date_str,
        currency=asset.currency or "EUR",
        created_at=asset.created_at,
    )

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

@router.post("/dedup", response_model=dict)
async def deduplicate_assets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Asset).where(Asset.user_email == current_user.email)
    )
    assets = result.scalars().all()
    total_assets_before = len(assets)

    groups: DefaultDict[Tuple[str, AssetType], List[Asset]] = defaultdict(list)
    for asset in assets:
        groups[(asset.symbol, asset.type)].append(asset)

    merged_groups = 0

    for (symbol, asset_type), group in groups.items():
        if len(group) < 2:
            continue

        merged_groups += 1
        group.sort(key=lambda a: (a.created_at is None, a.created_at))
        master = group[0]
        duplicates = group[1:]

        total_quantity = sum(a.quantity for a in group)
        weighted_price = (
            sum(a.quantity * a.purchase_price for a in group) / total_quantity
            if total_quantity > 0
            else 0.0
        )
        weighted_price_eur = (
            sum(a.quantity * (a.purchase_price_eur or 0.0) for a in group) / total_quantity
            if total_quantity > 0
            else 0.0
        )

        logging.info(
            "Merging %d duplicates for user=%s symbol=%s type=%s master=%s: "
            "quantity %s -> %s, purchase_price %s -> %s, purchase_price_eur %s -> %s",
            len(duplicates),
            current_user.email,
            symbol,
            asset_type.value,
            master.id,
            master.quantity,
            total_quantity,
            master.purchase_price,
            weighted_price,
            master.purchase_price_eur,
            weighted_price_eur,
        )

        master.quantity = round(total_quantity, 2)
        master.purchase_price = round(weighted_price, 2)
        master.purchase_price_eur = round(weighted_price_eur, 2)

        dup_ids = [dup.id for dup in duplicates]
        await db.execute(
            update(Transaction)
            .where(Transaction.asset_id.in_(dup_ids))
            .values(asset_id=master.id)
        )

        await db.execute(
            delete(Asset).where(Asset.id.in_(dup_ids))
        )

    await db.commit()

    result_after = await db.execute(
        select(Asset).where(Asset.user_email == current_user.email)
    )
    total_assets_after = len(result_after.scalars().all())

    return {
        "merged_groups": merged_groups,
        "total_assets_before": total_assets_before,
        "total_assets_after": total_assets_after,
    }

@router.post("/enrich-all")
async def enrich_all_assets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Asset).where(
            Asset.user_email == current_user.email,
            Asset.type == AssetType.STOCKS,
            Asset.sector.is_(None)
        )
    )
    assets = result.scalars().all()
    enriched = 0
    errors = []

    for asset in assets:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/{asset.symbol}",
                    params={"modules": "assetProfile"},
                    headers={"User-Agent": "Mozilla/5.0"}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    profile = data.get("quoteSummary", {}).get("result", [{}])[0].get("assetProfile", {})
                    if profile:
                        asset.sector = profile.get("sector")
                        asset.country = profile.get("country")
                        asset.industry = profile.get("industry")
                        enriched += 1
        except Exception as e:
            errors.append(f"{asset.symbol}: {str(e)}")

    await db.commit()
    return {"enriched": enriched, "errors": errors}

@router.post("/{asset_id}/enrich")
async def enrich_asset_metadata(
    asset_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Asset).where(Asset.id == asset_id, Asset.user_email == current_user.email)
    )
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if asset.type_value != "stocks":
        raise HTTPException(status_code=400, detail="Only stocks can be enriched")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/{asset.symbol}",
                params={"modules": "assetProfile"},
                headers={"User-Agent": "Mozilla/5.0"}
            )
            if resp.status_code == 200:
                data = resp.json()
                profile = data.get("quoteSummary", {}).get("result", [{}])[0].get("assetProfile", {})
                if profile:
                    asset.sector = profile.get("sector")
                    asset.country = profile.get("country")
                    asset.industry = profile.get("industry")
                    await db.commit()
                    return {"status": "enriched", "sector": asset.sector, "country": asset.country, "industry": asset.industry}
    except Exception as e:
        logging.warning(f"Failed to enrich {asset.symbol}: {e}")

    raise HTTPException(status_code=502, detail="Failed to fetch asset metadata")

@router.get("", response_model=PaginatedResponse[AssetResponse])
async def list_all_assets(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    base_query = select(Asset).where(Asset.user_email == current_user.email)

    # Get total count
    count_result = await db.execute(
        select(func.count()).select_from(base_query.subquery())
    )
    total = count_result.scalar() or 0

    # Get paginated results ordered by created_at desc
    result = await db.execute(
        base_query.order_by(Asset.created_at.desc()).limit(limit).offset(offset)
    )
    assets = result.scalars().all()

    return PaginatedResponse(
        data=[_asset_to_response(a) for a in assets],
        total=total,
        limit=limit,
        offset=offset,
    )

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
    return [_asset_to_response(a) for a in assets]

@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(
    asset: AssetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    asset_type = AssetType(asset.type)
    result = await db.execute(
        select(Asset).where(
            Asset.user_email == current_user.email,
            Asset.symbol == asset.symbol.upper(),
            Asset.type == asset_type
        )
    )
    existing = result.scalars().first()

    if existing:
        new_quantity = existing.quantity + asset.quantity
        existing.purchase_price = round(
            (existing.quantity * existing.purchase_price + asset.quantity * asset.purchase_price)
            / new_quantity, 2
        )
        existing.quantity = round(new_quantity, 2)
        await db.commit()
        await db.refresh(existing)
        db_asset = existing
    else:
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
            currency=asset.currency or 'EUR'
        )
        db.add(db_asset)
        await db.commit()
        await db.refresh(db_asset)

    # Backfill historical prices from purchase_date
    if db_asset.purchase_date:
        try:
            pd_val = db_asset.purchase_date
            if isinstance(pd_val, date):
                purchase_dt = datetime.combine(pd_val, datetime.min.time()).replace(tzinfo=timezone.utc)
            else:
                purchase_dt = datetime.strptime(pd_val, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            asset_type_str = asset_type.value
            await price_service.backfill_price_history(db, db_asset.id, db_asset.symbol, asset_type_str, purchase_dt)
        except Exception as e:
            logging.warning(f"Failed to backfill history for {db_asset.symbol}: {e}")

    # Create transaction
    pd_val = asset.purchase_date or db_asset.purchase_date
    if isinstance(pd_val, date):
        purchase_dt = datetime.combine(pd_val, datetime.min.time())
    elif isinstance(pd_val, str):
        purchase_dt = datetime.strptime(pd_val, "%Y-%m-%d")
    else:
        purchase_dt = datetime.now(timezone.utc)
    rate = await price_service.get_historical_exchange_rate(purchase_dt, asset.currency or 'EUR', 'EUR')

    if existing:
        old_quantity = existing.quantity - asset.quantity
        existing.purchase_price_eur = round(
            (old_quantity * (existing.purchase_price_eur or 0.0) + asset.quantity * asset.purchase_price * rate)
            / existing.quantity, 2
        )
    else:
        db_asset.purchase_price_eur = asset.purchase_price * rate

    tx = Transaction(
        id=str(uuid.uuid4()),
        user_email=current_user.email,
        asset_id=db_asset.id,
        type=TransactionType.BUY,
        symbol=db_asset.symbol,
        quantity=asset.quantity,
        unit_price=asset.purchase_price,
        currency=asset.currency or 'EUR',
        exchange_rate=rate,
        fees=0.0,
        total_invested=asset.quantity * asset.purchase_price * rate,
        date=purchase_dt.date()
    )
    db.add(tx)
    db.add(tx)
    await db.commit()

    return _asset_to_response(db_asset)

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
    db_asset = result.scalars().first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    update_data = asset_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    for field, value in update_data.items():
        setattr(db_asset, field, value)

    if {"symbol", "quantity", "purchase_price"} & set(update_data.keys()):
        result = await db.execute(
            select(Transaction).where(
                Transaction.asset_id == asset_id,
                Transaction.user_email == current_user.email,
                Transaction.type == TransactionType.BUY
            ).order_by(Transaction.created_at.asc())
        )
        tx = result.scalars().first()
        if tx:
            if "symbol" in update_data:
                tx.symbol = db_asset.symbol.upper()
            if "quantity" in update_data:
                tx.quantity = db_asset.quantity
            if "purchase_price" in update_data:
                tx.unit_price = db_asset.purchase_price
                tx.total_invested = db_asset.quantity * db_asset.purchase_price

    await db.commit()
    await db.refresh(db_asset)

    return _asset_to_response(db_asset)

@router.post("/{asset_id}/backfill-history")
async def backfill_asset_history(
    asset_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Asset).where(Asset.id == asset_id, Asset.user_email == current_user.email)
    )
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if not asset.purchase_date:
        raise HTTPException(status_code=400, detail="Asset has no purchase_date")

    pd_val = asset.purchase_date
    if isinstance(pd_val, date):
        purchase_dt = datetime.combine(pd_val, datetime.min.time()).replace(tzinfo=timezone.utc)
    else:
        purchase_dt = datetime.strptime(pd_val, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    asset_type_str = asset.type_value
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
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    await db.execute(
        delete(Transaction).where(
            Transaction.asset_id == asset_id,
            Transaction.user_email == current_user.email
        )
    )

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
        asset_type_str = asset.type_value
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
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    asset_type_str = asset.type_value
    current_price = await price_service.get_price(asset_type_str, asset.symbol)
    if current_price is None:
        current_price = asset.current_price

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
        ohlc=None,
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
    if len(contents) > 5_000_000:  # 5MB
        raise HTTPException(status_code=413, detail="File too large (max 5MB)")
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
                purchase_price_eur=purchase_price,
                current_price=current_price,
                purchase_date=purchase_date,
                currency="EUR"
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