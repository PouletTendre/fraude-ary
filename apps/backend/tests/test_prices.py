import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

from app.models.asset import Asset, AssetType


@pytest.mark.asyncio
async def test_refresh_prices_empty(client: AsyncClient, auth_headers: dict):
    response = await client.post("/api/v1/prices/refresh", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["prices_updated"] == 0


@pytest.mark.asyncio
@patch("app.services.price_service.price_service.refresh_crypto_prices", new_callable=AsyncMock)
@patch("app.services.price_service.price_service.refresh_stock_prices", new_callable=AsyncMock)
async def test_refresh_prices_with_assets(
    mock_refresh_stocks,
    mock_refresh_crypto,
    client: AsyncClient,
    auth_headers: dict,
    db_session
):
    mock_refresh_crypto.return_value = {"btc": 50000.0}
    mock_refresh_stocks.return_value = {}

    asset = Asset(
        id="test-asset-prices",
        user_email="test@example.com",
        type=AssetType.CRYPTO,
        symbol="BTC",
        quantity=1.0,
        purchase_price=45000.0,
        current_price=45000.0
    )
    db_session.add(asset)
    await db_session.commit()

    response = await client.post("/api/v1/prices/refresh", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["prices_updated"] == 1


@pytest.mark.asyncio
async def test_get_price_history_asset_not_found(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/prices/history/nonexistent-id", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_refresh_prices_unauthorized(client: AsyncClient):
    response = await client.post("/api/v1/prices/refresh")
    assert response.status_code == 401


@pytest.mark.asyncio
@patch("app.services.price_service.price_service.get_price", new_callable=AsyncMock)
async def test_auto_refresh_all_prices(mock_get_price, db_session):
    mock_get_price.return_value = 60000.0

    from app.services.price_service import price_service
    from app.models.asset import Asset, AssetType

    asset = Asset(
        id="test-auto-refresh",
        user_email="test@example.com",
        type=AssetType.CRYPTO,
        symbol="BTC",
        quantity=1.0,
        purchase_price=45000.0,
        current_price=45000.0
    )
    db_session.add(asset)
    await db_session.commit()

    result = await price_service.auto_refresh_all_prices(db_session)
    assert result["updated"] == 1
    assert asset.current_price == 60000.0
