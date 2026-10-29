from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_zero_duration_and_inverted_times_rejected(client: AsyncClient, seed_test_data):
    user = seed_test_data["user"]
    resource = seed_test_data["resource"]
    headers = auth_headers(user.id, "user", str(user.org_id))

    now = datetime.now(timezone.utc) + timedelta(days=2)

    # 1. Zero duration booking
    zero_resp = await client.post(
        "/api/v1/bookings/",
        headers=headers,
        json={
            "resource_id": resource.id,
            "start_at": now.isoformat(),
            "end_at": now.isoformat(),
            "purpose": "Zero duration attempt",
        },
    )
    assert zero_resp.status_code == 422
    assert "End time must be strictly after start time" in zero_resp.text

    # 2. Inverted time booking (end before start)
    inverted_resp = await client.post(
        "/api/v1/bookings/",
        headers=headers,
        json={
            "resource_id": resource.id,
            "start_at": (now + timedelta(hours=2)).isoformat(),
            "end_at": now.isoformat(),
            "purpose": "Inverted time attempt",
        },
    )
    assert inverted_resp.status_code == 422
    assert "End time must be strictly after start time" in inverted_resp.text


@pytest.mark.asyncio
async def test_negative_topup_and_negative_prices_rejected(client: AsyncClient, seed_test_data):
    user = seed_test_data["user"]
    owner = seed_test_data["owner"]
    user_headers = auth_headers(user.id, "user", str(user.org_id))
    owner_headers = auth_headers(owner.id, "owner", str(owner.org_id))

    # 1. Negative wallet top-up
    neg_topup = await client.post(
        "/api/v1/wallet/topup",
        headers=user_headers,
        json={"amount_credits": -500},
    )
    assert neg_topup.status_code == 422

    # 2. Negative hourly rate on resource
    neg_res = await client.post(
        "/api/v1/resources/",
        headers=owner_headers,
        json={
            "title": "Invalid Price Resource",
            "description": "Attempt negative price",
            "kind": "equipment",
            "category": "Testing",
            "location": "Room 101",
            "hourly_rate": -150.0,
            "deposit_amount": -50.0,
        },
    )
    assert neg_res.status_code == 422


@pytest.mark.asyncio
async def test_midnight_and_utc_cross_boundary_booking(client: AsyncClient, seed_test_data):
    user = seed_test_data["user"]
    resource = seed_test_data["resource"]
    headers = auth_headers(user.id, "user", str(user.org_id))

    # Booking across UTC midnight: 23:00 to 01:00 (2 hours total)
    base_date = (datetime.now(timezone.utc) + timedelta(days=3)).replace(hour=23, minute=0, second=0, microsecond=0)
    end_date = base_date + timedelta(hours=2)

    resp = await client.post(
        "/api/v1/bookings/",
        headers=headers,
        json={
            "resource_id": resource.id,
            "start_at": base_date.isoformat(),
            "end_at": end_date.isoformat(),
            "purpose": "Midnight run experiment",
            "is_academic": True,
        },
    )
    assert resp.status_code in [201, 409]
    if resp.status_code == 201:
        data = resp.json()
        assert data["status"] in ["pending", "approved"]
        # Confirm start and end are preserved exactly in UTC
        assert data["start_at"].endswith("Z") or "+00:00" in data["start_at"]


@pytest.mark.asyncio
async def test_unicode_emojis_and_injection_resilience(client: AsyncClient, seed_test_data):
    owner = seed_test_data["owner"]
    user = seed_test_data["user"]
    owner_headers = auth_headers(owner.id, "owner", str(owner.org_id))
    user_headers = auth_headers(user.id, "user", str(user.org_id))

    # 1. Non-ASCII, Unicode & emojis in listing
    emoji_title = "🔬 Quantum Spectrometer ⚡ [தமிழ் & 日本語 & 한국어]"
    emoji_desc = "Laser precision 🔥 100% calibrated — 🚀 Ready for tests."
    res_resp = await client.post(
        "/api/v1/resources/",
        headers=owner_headers,
        json={
            "title": emoji_title,
            "description": emoji_desc,
            "kind": "equipment",
            "category": "Optics",
            "location": "Bay 99 🌐",
            "status": "live",
            "hourly_rate": 100.0,
            "availability_windows": [
                {"weekday": i, "start_time": "00:00", "end_time": "23:59"}
                for i in range(7)
            ],
        },
    )
    assert res_resp.status_code == 201
    created_res = res_resp.json()
    assert created_res["title"] == emoji_title
    assert created_res["description"] == emoji_desc

    # 2. Search query with SQL injection characters
    sqli_queries = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "UNION SELECT NULL, NULL, NULL --",
        "<script>alert('xss')</script>",
    ]
    for q in sqli_queries:
        search_resp = await client.get(f"/api/v1/resources/?query={q}", headers=user_headers)
        assert search_resp.status_code == 200
        # Results should be an array, no 500 error or SQL crash
        assert isinstance(search_resp.json(), list)

