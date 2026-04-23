import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta

from app.models.asset import Asset, AssetType, PriceHistory
from app.models.alert import PortfolioSnapshot


@pytest.mark.asyncio
async def test_portfolio_history_empty(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/portfolio/history?period=1m", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["period"] == "1m"
    assert data["history"] == []


@pytest.mark.asyncio
async def test_portfolio_history_with_snapshots(client: AsyncClient, auth_headers: dict, db_session):
    now = datetime.utcnow()
    snapshot = PortfolioSnapshot(
        id="test-snapshot-1",
        user_email="test@example.com",
        date=now - timedelta(days=5),
        total_value=50000.0,
    )
    db_session.add(snapshot)
    await db_session.commit()

    response = await client.get("/api/v1/portfolio/history?period=1m", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["history"]) == 1
    assert data["history"][0]["total_value"] == 50000.0


@pytest.mark.asyncio
async def test_portfolio_history_from_price_history(client: AsyncClient, auth_headers: dict, db_session):
    asset = Asset(
        id="test-asset-history",
        user_email="test@example.com",
        type=AssetType.CRYPTO,
        symbol="BTC",
        quantity=1.0,
        purchase_price=45000.0,
        current_price=50000.0,
    )
    db_session.add(asset)
    await db_session.commit()

    ph = PriceHistory(
        id="test-ph-1",
        asset_id="test-asset-history",
        price=48000.0,
        timestamp=datetime.utcnow() - timedelta(days=2),
    )
    db_session.add(ph)
    await db_session.commit()

    response = await client.get("/api/v1/portfolio/history?period=1m", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["history"]) >= 1


@pytest.mark.asyncio
async def test_portfolio_history_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/portfolio/history?period=1m")
    assert response.status_code == 401
