import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

from app.models.asset import Asset, AssetType


@pytest.mark.asyncio
async def test_list_all_assets_empty(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/assets", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_list_assets_by_type(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/assets/crypto", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_list_assets_invalid_type(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/assets/invalid", headers=auth_headers)
    assert response.status_code == 400
    assert "Invalid asset type" in response.json()["detail"]


@pytest.mark.asyncio
@patch("app.services.price_service.price_service.get_price", new_callable=AsyncMock)
async def test_create_asset(mock_get_price, client: AsyncClient, auth_headers: dict, db_session):
    mock_get_price.return_value = 50000.0

    response = await client.post(
        "/api/v1/assets",
        headers=auth_headers,
        json={
            "type": "crypto",
            "symbol": "BTC",
            "quantity": 1.5,
            "purchase_price": 45000.0
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["symbol"] == "BTC"
    assert data["quantity"] == 1.5
    assert data["current_price"] == 50000.0


@pytest.mark.asyncio
async def test_delete_asset_not_found(client: AsyncClient, auth_headers: dict):
    response = await client.delete(
        "/api/v1/assets/nonexistent-id",
        headers=auth_headers
    )
    assert response.status_code == 404


@pytest.mark.asyncio
@patch("app.services.price_service.price_service.get_price", new_callable=AsyncMock)
async def test_update_asset(mock_get_price, client: AsyncClient, auth_headers: dict, db_session, test_user):
    from app.database import get_db
    asset = Asset(
        id="test-asset-id",
        user_email="test@example.com",
        type=AssetType.CRYPTO,
        symbol="ETH",
        quantity=2.0,
        purchase_price=3000.0,
        current_price=3000.0
    )
    db_session.add(asset)
    await db_session.commit()

    response = await client.put(
        "/api/v1/assets/test-asset-id",
        headers=auth_headers,
        json={"quantity": 5.0}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["quantity"] == 5.0


@pytest.mark.asyncio
async def test_update_asset_not_found(client: AsyncClient, auth_headers: dict):
    response = await client.put(
        "/api/v1/assets/nonexistent-id",
        headers=auth_headers,
        json={"quantity": 5.0}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_asset_no_fields(client: AsyncClient, auth_headers: dict, db_session):
    from app.database import get_db
    asset = Asset(
        id="test-asset-id-2",
        user_email="test@example.com",
        type=AssetType.CRYPTO,
        symbol="BTC",
        quantity=1.0,
        purchase_price=40000.0,
        current_price=40000.0
    )
    db_session.add(asset)
    await db_session.commit()

    response = await client.put(
        "/api/v1/assets/test-asset-id-2",
        headers=auth_headers,
        json={}
    )
    assert response.status_code == 400
