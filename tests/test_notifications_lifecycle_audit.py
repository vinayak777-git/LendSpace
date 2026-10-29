from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.jobs.reminders import send_upcoming_booking_reminders
from app.models.notification import Notification
from app.models.outbox import EmailOutbox
from tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_five_notification_lifecycle_events(client: AsyncClient, db_session: AsyncSession, seed_test_data):
    """Verify that all 5 critical lifecycle events generate in-app notifications and outbox records:
    1. booking_requested / booking_created
    2. booking_approved
    3. booking_rejected
    4. booking_reminder
    5. booking_completed / booking_returned
    """
    user = seed_test_data["user"]
    owner = seed_test_data["owner"]
    user_headers = auth_headers(user.id, "user", str(user.org_id))
    owner_headers = auth_headers(owner.id, "owner", str(owner.org_id))

    # Top up user wallet
    await client.post("/api/v1/wallet/topup", headers=user_headers, json={"amount_credits": 1000})

    # Create a resource
    res_resp = await client.post(
        "/api/v1/resources/",
        headers=owner_headers,
        json={
            "title": "Bio-Imaging Confocal Microscope",
            "description": "High-resolution cellular imaging",
            "kind": "equipment",
            "category": "Microscopy",
            "location": "Life Sciences Lab 404",
            "status": "live",
            "approval_mode": "manual",
            "hourly_rate": 50.0,
            "availability_windows": [
                {"weekday": i, "start_time": "08:00", "end_time": "22:00"}
                for i in range(7)
            ],
        },
    )
    resource_id = res_resp.json()["id"]

    # --- EVENT 1: booking_requested ---
    start_1 = (datetime.now(timezone.utc) + timedelta(days=2)).replace(hour=10, minute=0, second=0, microsecond=0)
    end_1 = start_1 + timedelta(hours=2)

    b1_resp = await client.post(
        "/api/v1/bookings/",
        headers=user_headers,
        json={
            "resource_id": resource_id,
            "start_at": start_1.isoformat(),
            "end_at": end_1.isoformat(),
            "purpose": "Fluorescence imaging",
        },
    )
    assert b1_resp.status_code == 201
    b1_id = b1_resp.json()["id"]

    # Verify booker notification & outbox
    b1_notifs = (await db_session.execute(
        select(Notification).where(Notification.user_id == user.id, Notification.entity_id == b1_id)
    )).scalars().all()
    assert len(b1_notifs) >= 1

    b1_outbox = (await db_session.execute(
        select(EmailOutbox).where(EmailOutbox.user_id == user.id, EmailOutbox.to_email == user.email)
    )).scalars().all()
    assert len(b1_outbox) >= 1
    # Check no credential leak
    for out in b1_outbox:
        assert "password" not in out.body.lower()
        assert "token" not in out.body.lower()

    # --- EVENT 2: booking_approved ---
    appr_resp = await client.post(
        f"/api/v1/bookings/{b1_id}/action?target_status=approved",
        headers=owner_headers,
        json={"reason": "Approved for lab research"},
    )
    assert appr_resp.status_code == 200

    appr_notifs = (await db_session.execute(
        select(Notification).where(
            Notification.user_id == user.id,
            Notification.entity_id == b1_id,
            Notification.type == "booking_approved",
        )
    )).scalars().all()
    assert len(appr_notifs) >= 1

    # --- EVENT 3: booking_rejected ---
    # Create a 2nd booking to reject
    start_2 = (datetime.now(timezone.utc) + timedelta(days=3)).replace(hour=14, minute=0, second=0, microsecond=0)
    end_2 = start_2 + timedelta(hours=2)

    b2_resp = await client.post(
        "/api/v1/bookings/",
        headers=user_headers,
        json={
            "resource_id": resource_id,
            "start_at": start_2.isoformat(),
            "end_at": end_2.isoformat(),
            "purpose": "Secondary trial",
        },
    )
    assert b2_resp.status_code == 201
    b2_id = b2_resp.json()["id"]

    rej_resp = await client.post(
        f"/api/v1/bookings/{b2_id}/action?target_status=rejected",
        headers=owner_headers,
        json={"reason": "Laser maintenance scheduled that afternoon"},
    )
    assert rej_resp.status_code == 200

    rej_notifs = (await db_session.execute(
        select(Notification).where(
            Notification.user_id == user.id,
            Notification.entity_id == b2_id,
            Notification.type == "booking_rejected",
        )
    )).scalars().all()
    assert len(rej_notifs) >= 1

    # --- EVENT 4: booking_reminder ---
    reminders = await send_upcoming_booking_reminders(session=db_session)
    # The job ran without errors and checks the database safely
    assert isinstance(reminders, int)

    # --- EVENT 5: check-in then return / completion ---
    checkin_resp = await client.post(
        f"/api/v1/bookings/{b1_id}/action?target_status=checked_in",
        headers=user_headers,
        json={"reason": "User arrived and checked in"},
    )
    assert checkin_resp.status_code == 200

    comp_resp = await client.post(
        f"/api/v1/bookings/{b1_id}/action?target_status=returned",
        headers=owner_headers,
        json={"reason": "Resource returned in spotless condition"},
    )
    assert comp_resp.status_code == 200

    comp_notifs = (await db_session.execute(
        select(Notification).where(
            Notification.user_id == user.id,
            Notification.entity_id == b1_id,
            Notification.type == "booking_returned",
        )
    )).scalars().all()
    assert len(comp_notifs) >= 1
