from datetime import datetime, timedelta, timezone
from pathlib import Path
import pytest
from httpx import AsyncClient
from tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_notification_outbox_and_eml_files(client: AsyncClient, seed_test_data):
    user = seed_test_data["user"]
    owner = seed_test_data["owner"]
    user_headers = auth_headers(user.id, "user", str(user.org_id))
    owner_headers = auth_headers(owner.id, "owner", str(owner.org_id))

    # Clean or count current outbox files
    outbox_dir = Path("outbox")
    outbox_dir.mkdir(parents=True, exist_ok=True)
    initial_file_count = len(list(outbox_dir.glob("*.eml")))

    # Create a free resource
    res_resp = await client.post(
        "/api/v1/resources/",
        headers=owner_headers,
        json={
            "title": "Electronics Soldering Workstation",
            "description": "Temperature controlled station with fume extractor",
            "kind": "equipment",
            "category": "Electronics",
            "location": "Electronics Lab 03",
            "status": "live",
            "approval_mode": "auto",
            "hourly_rate": 0.0,
            "deposit_amount": 0.0,
            "pricing_model": "free",
            "currency": "₹",
            "max_hours_per_booking": 4,
            "max_hours_per_week_per_user": 12,
            "buffer_minutes": 15,
            "requirements": [],
            "availability_windows": [
                {"weekday": i, "start_time": "08:00", "end_time": "20:00"}
                for i in range(7)
            ],
            "blackout_dates": [],
            "managers": [],
        },
    )
    resource_id = res_resp.json()["id"]

    # Book resource
    start_at = (datetime.now(timezone.utc) + timedelta(days=6)).replace(hour=9, minute=0, second=0, microsecond=0)
    end_at = start_at + timedelta(hours=1)

    book_resp = await client.post(
        "/api/v1/bookings/",
        headers=user_headers,
        json={
            "resource_id": resource_id,
            "start_at": start_at.isoformat(),
            "end_at": end_at.isoformat(),
            "purpose": "PCB soldering for telemetry module",
            "is_academic": True,
        },
    )
    assert book_resp.status_code == 201

    # Check that new .eml files have been generated in outbox directory
    new_file_count = len(list(outbox_dir.glob("*.eml")))
    assert new_file_count > initial_file_count

    # Check GET /api/v1/notifications/outbox
    outbox_resp = await client.get("/api/v1/notifications/outbox", headers=user_headers)
    assert outbox_resp.status_code == 200
    emails = outbox_resp.json()
    assert len(emails) > 0
    assert any("Electronics Soldering Workstation" in e["subject"] for e in emails)


@pytest.mark.asyncio
async def test_sse_stream_connection(client: AsyncClient, seed_test_data):
    user = seed_test_data["user"]
    user_headers = auth_headers(user.id, "user", str(user.org_id))
    token = user_headers["Authorization"].split(" ")[1]

    # SSE endpoint with single_tick=true
    resp = await client.get(f"/api/v1/notifications/stream?token={token}&single_tick=true")
    assert resp.status_code == 200
    assert "text/event-stream" in resp.headers.get("content-type", "")
    assert "event: connected" in resp.text
