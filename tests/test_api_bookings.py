from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_booking_creation_and_lifecycle(client: AsyncClient, seed_test_data):
    user = seed_test_data["user"]
    owner = seed_test_data["owner"]
    resource = seed_test_data["resource"]

    user_headers = auth_headers(user.id, "user", str(user.org_id))
    owner_headers = auth_headers(owner.id, "owner", str(owner.org_id))

    # Calculate tomorrow at 10:00 UTC
    tomorrow = datetime.now(timezone.utc) + timedelta(days=1)
    start_at = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)
    end_at = start_at + timedelta(hours=2)

    # 1. Create booking (resource approval_mode is "auto", so status becomes "approved")
    book_resp = await client.post(
        "/api/v1/bookings/",
        json={
            "resource_id": resource.id,
            "start_at": start_at.isoformat(),
            "end_at": end_at.isoformat(),
            "purpose": "Capstone robot arm 3D print",
            "is_academic": True,
        },
        headers=user_headers,
    )
    assert book_resp.status_code == 201
    booking = book_resp.json()
    assert booking["status"] == "approved"
    booking_id = booking["id"]

    # 2. Verify overlapping booking conflict check
    conflict_resp = await client.post(
        "/api/v1/bookings/check-conflicts",
        json={
            "resource_id": resource.id,
            "start_at": start_at.isoformat(),
            "end_at": end_at.isoformat(),
        },
    )
    assert conflict_resp.status_code == 200
    assert conflict_resp.json()["has_conflict"] is True
    assert len(conflict_resp.json()["suggested_slots"]) > 0

    # 3. Transition booking: approved -> checked_in
    checkin_resp = await client.post(
        f"/api/v1/bookings/{booking_id}/action?target_status=checked_in",
        json={"reason": "User checked in at lab terminal"},
        headers=user_headers,
    )
    assert checkin_resp.status_code == 200
    assert checkin_resp.json()["status"] == "checked_in"

    # 4. Transition booking: checked_in -> returned
    return_resp = await client.post(
        f"/api/v1/bookings/{booking_id}/action?target_status=returned",
        json={"reason": "Clean return and checklist verified"},
        headers=user_headers,
    )
    assert return_resp.status_code == 200
    assert return_resp.json()["status"] == "returned"

    # 5. Invalid transition returns HTTP 409
    invalid_resp = await client.post(
        f"/api/v1/bookings/{booking_id}/action?target_status=pending",
        json={"reason": "Illegal transition"},
        headers=owner_headers,
    )
    assert invalid_resp.status_code == 409


@pytest.mark.asyncio
async def test_concurrent_booking_requests_only_one_wins(client: AsyncClient, seed_test_data):
    import asyncio

    user = seed_test_data["user"]
    resource = seed_test_data["resource"]
    user_headers = auth_headers(user.id, "user", str(user.org_id))

    # Same target window 3 days from now
    target_date = datetime.now(timezone.utc) + timedelta(days=3)
    start_at = target_date.replace(hour=14, minute=0, second=0, microsecond=0)
    end_at = start_at + timedelta(hours=2)

    payload = {
        "resource_id": resource.id,
        "start_at": start_at.isoformat(),
        "end_at": end_at.isoformat(),
        "purpose": "Simultaneous booking collision test",
        "is_academic": True,
    }

    # Execute 20 concurrent booking requests
    tasks = [
        client.post("/api/v1/bookings/", json=payload, headers=user_headers)
        for _ in range(20)
    ]
    responses = await asyncio.gather(*tasks)

    status_codes = [r.status_code for r in responses]
    created_count = status_codes.count(201)
    conflict_count = status_codes.count(409)

    # Exactly one request succeeds with 201 Created; exactly 19 are rejected with 409 Conflict
    assert created_count == 1
    assert conflict_count == 19
    for r in responses:
        if r.status_code == 409:
            assert "already reserved" in r.json()["detail"].lower() or "slot" in r.json()["detail"].lower()
