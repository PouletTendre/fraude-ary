import pytest
from httpx import AsyncClient

from app.models.alert import PriceAlert, AlertCondition


@pytest.mark.asyncio
async def test_create_alert(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/v1/alerts",
        headers=auth_headers,
        json={
            "symbol": "BTC",
            "target_price": 60000.0,
            "condition": "above"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["symbol"] == "BTC"
    assert data["target_price"] == 60000.0
    assert data["condition"] == "above"
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_list_alerts(client: AsyncClient, auth_headers: dict, db_session):
    alert = PriceAlert(
        id="test-alert-1",
        user_email="test@example.com",
        symbol="ETH",
        target_price=3000.0,
        condition=AlertCondition.BELOW,
        is_active=True,
    )
    db_session.add(alert)
    await db_session.commit()

    response = await client.get("/api/v1/alerts", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["symbol"] == "ETH"
    assert data[0]["condition"] == "below"


@pytest.mark.asyncio
async def test_delete_alert(client: AsyncClient, auth_headers: dict, db_session):
    alert = PriceAlert(
        id="test-alert-2",
        user_email="test@example.com",
        symbol="AAPL",
        target_price=200.0,
        condition=AlertCondition.ABOVE,
        is_active=True,
    )
    db_session.add(alert)
    await db_session.commit()

    response = await client.delete("/api/v1/alerts/test-alert-2", headers=auth_headers)
    assert response.status_code == 204

    response = await client.get("/api/v1/alerts", headers=auth_headers)
    assert response.json() == []


@pytest.mark.asyncio
async def test_delete_alert_not_found(client: AsyncClient, auth_headers: dict):
    response = await client.delete("/api/v1/alerts/nonexistent-id", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_alert_unauthorized(client: AsyncClient):
    response = await client.post(
        "/api/v1/alerts",
        json={
            "symbol": "BTC",
            "target_price": 60000.0,
            "condition": "above"
        }
    )
    assert response.status_code == 401
