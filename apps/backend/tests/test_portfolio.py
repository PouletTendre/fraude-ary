import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

from app.models.asset import Asset, AssetType


@pytest.mark.asyncio
async def test_portfolio_summary_empty(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/portfolio/summary", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_value"] == 0
    assert data["assets"] == []
    assert data["allocation"]["crypto"] == 0
    assert data["allocation"]["stocks"] == 0
    assert data["allocation"]["real_estate"] == 0


@pytest.mark.asyncio
@patch("app.services.price_service.price_service.get_price", new_callable=AsyncMock)
async def test_portfolio_summary_with_assets(mock_get_price, client: AsyncClient, auth_headers: dict, db_session):
    mock_get_price.return_value = 50000.0

    asset = Asset(
        id="test-asset-portfolio",
        user_email="test@example.com",
        type=AssetType.CRYPTO,
        symbol="BTC",
        quantity=1.0,
        purchase_price=45000.0,
        current_price=45000.0
    )
    db_session.add(asset)
    await db_session.commit()

    response = await client.get("/api/v1/portfolio/summary", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_value"] == 50000.0
    assert len(data["assets"]) == 1
    assert data["allocation"]["crypto"] == 100.0


@pytest.mark.asyncio
async def test_portfolio_summary_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/portfolio/summary")
    assert response.status_code == 401
