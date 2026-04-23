import pytest
from httpx import AsyncClient

from app.models.alert import Notification


@pytest.mark.asyncio
async def test_list_notifications(client: AsyncClient, auth_headers: dict, db_session):
    notification = Notification(
        id="test-notif-1",
        user_email="test@example.com",
        message="BTC price alert triggered",
        is_read=False,
    )
    db_session.add(notification)
    await db_session.commit()

    response = await client.get("/api/v1/notifications", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["message"] == "BTC price alert triggered"
    assert data[0]["is_read"] is False


@pytest.mark.asyncio
async def test_list_notifications_only_unread(client: AsyncClient, auth_headers: dict, db_session):
    notification = Notification(
        id="test-notif-2",
        user_email="test@example.com",
        message="Already read",
        is_read=True,
    )
    db_session.add(notification)
    await db_session.commit()

    response = await client.get("/api/v1/notifications", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data == []


@pytest.mark.asyncio
async def test_mark_notification_read(client: AsyncClient, auth_headers: dict, db_session):
    notification = Notification(
        id="test-notif-3",
        user_email="test@example.com",
        message="Mark me as read",
        is_read=False,
    )
    db_session.add(notification)
    await db_session.commit()

    response = await client.put("/api/v1/notifications/test-notif-3/read", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["is_read"] is True


@pytest.mark.asyncio
async def test_mark_notification_read_not_found(client: AsyncClient, auth_headers: dict):
    response = await client.put("/api/v1/notifications/nonexistent-id/read", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_notifications_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/notifications")
    assert response.status_code == 401
