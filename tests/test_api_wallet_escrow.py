from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_wallet_topup_and_balance(client: AsyncClient, seed_test_data):
    user = seed_test_data["user"]
    headers = auth_headers(user.id, "user", str(user.org_id))

    # Initial balance should be 0
    init_resp = await client.get("/api/v1/wallet/me", headers=headers)
    assert init_resp.status_code == 200
    assert init_resp.json()["balance_minor_units"] == 0

    # Top up 100 credits
    topup_resp = await client.post(
        "/api/v1/wallet/topup",
        headers=headers,
        json={"amount_credits": 100, "idempotency_key": "topup-unique-123"},
    )
    assert topup_resp.status_code == 200
    data = topup_resp.json()
    assert data["success"] is True
    assert data["new_balance_minor"] == 10000

    # Re-sending same idempotency key must not double-credit
    dup_resp = await client.post(
        "/api/v1/wallet/topup",
        headers=headers,
        json={"amount_credits": 100, "idempotency_key": "topup-unique-123"},
    )
    assert dup_resp.status_code == 200

    check_resp = await client.get("/api/v1/wallet/me", headers=headers)
    assert check_resp.status_code == 200
    assert check_resp.json()["balance_minor_units"] == 10000
    assert len(check_resp.json()["ledger"]) == 1


@pytest.mark.asyncio
async def test_escrow_hold_and_release_lifecycle(client: AsyncClient, seed_test_data):
    user = seed_test_data["user"]
    owner = seed_test_data["owner"]
    user_headers = auth_headers(user.id, "user", str(user.org_id))
    owner_headers = auth_headers(owner.id, "owner", str(owner.org_id))

    # 1. Create a paid resource
    res_resp = await client.post(
        "/api/v1/resources/",
        headers=owner_headers,
        json={
            "title": "Industrial High-Temp Sintering Furnace",
            "description": "High temperature ceramic kiln",
            "kind": "equipment",
            "category": "Thermal Processing",
            "location": "Ceramics Lab 02",
            "status": "live",
            "approval_mode": "manual",
            "hourly_rate": 50.0,
            "deposit_amount": 25.0,
            "pricing_model": "hourly",
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
    assert res_resp.status_code == 201
    resource_id = res_resp.json()["id"]

    # 2. Top up booker wallet: 200 credits
    await client.post(
        "/api/v1/wallet/topup",
        headers=user_headers,
        json={"amount_credits": 200},
    )

    # 3. Book 2 hours (Cost: 2h * 50 = 100 rent + 25 deposit = 125 total hold)
    start_at = (datetime.now(timezone.utc) + timedelta(days=4)).replace(hour=10, minute=0, second=0, microsecond=0)
    end_at = start_at + timedelta(hours=2)

    book_resp = await client.post(
        "/api/v1/bookings/",
        headers=user_headers,
        json={
            "resource_id": resource_id,
            "start_at": start_at.isoformat(),
            "end_at": end_at.isoformat(),
            "purpose": "Ceramic composite sintering run",
            "is_academic": True,
        },
    )
    assert book_resp.status_code == 201
    booking_id = book_resp.json()["id"]
    assert book_resp.json()["payment_status"] == "held"
    assert book_resp.json()["total_price_minor_units"] == 10000
    assert book_resp.json()["deposit_minor_units"] == 2500

    # 4. Check booker wallet: 20000 - 12500 = 7500 minor units
    wallet_resp = await client.get("/api/v1/wallet/me", headers=user_headers)
    assert wallet_resp.json()["balance_minor_units"] == 7500

    # 5. Owner approves booking
    appr_resp = await client.post(
        f"/api/v1/bookings/{booking_id}/action?target_status=approved",
        headers=owner_headers,
        json={"reason": "Approved for lab operations"},
    )
    assert appr_resp.status_code == 200

    # 6. Check in
    await client.post(
        f"/api/v1/bookings/{booking_id}/action?target_status=checked_in",
        headers=user_headers,
        json={"reason": "Started furnace run"},
    )

    # 7. Complete / Return: Escrow released (payout rent to owner, deposit refund to booker)
    ret_resp = await client.post(
        f"/api/v1/bookings/{booking_id}/action?target_status=returned",
        headers=user_headers,
        json={"reason": "Completed clean cycle, temp normal"},
    )
    assert ret_resp.status_code == 200
    assert ret_resp.json()["payment_status"] == "released"

    # 8. Booker wallet restored deposit: 7500 + 2500 = 10000 minor units (100 credits remaining)
    b_after = await client.get("/api/v1/wallet/me", headers=user_headers)
    assert b_after.json()["balance_minor_units"] == 10000

    # 9. Owner earnings summary
    earnings_resp = await client.get("/api/v1/wallet/owner/earnings", headers=owner_headers)
    assert earnings_resp.status_code == 200
    earnings_data = earnings_resp.json()
    assert earnings_data["total_earned_minor"] >= 10000


@pytest.mark.asyncio
async def test_escrow_refund_on_rejection(client: AsyncClient, seed_test_data):
    user = seed_test_data["user"]
    owner = seed_test_data["owner"]
    user_headers = auth_headers(user.id, "user", str(user.org_id))
    owner_headers = auth_headers(owner.id, "owner", str(owner.org_id))

    res_resp = await client.post(
        "/api/v1/resources/",
        headers=owner_headers,
        json={
            "title": "High Frequency Spectrum Analyzer",
            "description": "RF testing analyzer up to 6GHz",
            "kind": "equipment",
            "category": "Electronics",
            "location": "RF Lab 01",
            "status": "live",
            "approval_mode": "manual",
            "hourly_rate": 40.0,
            "deposit_amount": 0.0,
            "pricing_model": "hourly",
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

    # Top up 100 credits
    await client.post(
        "/api/v1/wallet/topup",
        headers=user_headers,
        json={"amount_credits": 100},
    )

    # Book 1 hour (₹40 = 4000 minor units)
    start_at = (datetime.now(timezone.utc) + timedelta(days=5)).replace(hour=11, minute=0, second=0, microsecond=0)
    end_at = start_at + timedelta(hours=1)

    book_resp = await client.post(
        "/api/v1/bookings/",
        headers=user_headers,
        json={
            "resource_id": resource_id,
            "start_at": start_at.isoformat(),
            "end_at": end_at.isoformat(),
            "purpose": "Antenna radiation pattern test",
            "is_academic": True,
        },
    )
    booking_id = book_resp.json()["id"]

    # Balance after hold: 10000 - 4000 = 6000
    mid_wallet = await client.get("/api/v1/wallet/me", headers=user_headers)
    assert mid_wallet.json()["balance_minor_units"] == 6000

    # Owner rejects booking
    rej_resp = await client.post(
        f"/api/v1/bookings/{booking_id}/action?target_status=rejected",
        headers=owner_headers,
        json={"reason": "RF Lab maintenance during that block."},
    )
    assert rej_resp.status_code == 200
    assert rej_resp.json()["payment_status"] == "refunded"

    # Booker wallet fully refunded back to 10000
    refunded_wallet = await client.get("/api/v1/wallet/me", headers=user_headers)
    assert refunded_wallet.json()["balance_minor_units"] == 10000


@pytest.mark.asyncio
async def test_20_concurrent_wallet_debits_ledger_exact(client: AsyncClient, seed_test_data):
    import asyncio

    user = seed_test_data["user"]
    owner = seed_test_data["owner"]
    user_headers = auth_headers(user.id, "user", str(user.org_id))
    owner_headers = auth_headers(owner.id, "owner", str(owner.org_id))

    # Top up exactly 500 credits (50,000 minor units)
    await client.post(
        "/api/v1/wallet/topup",
        headers=user_headers,
        json={"amount_credits": 500},
    )

    # Create 20 distinct paid resources (₹50/hr flat rate = 5,000 minor units each)
    resources = []
    for i in range(20):
        r_resp = await client.post(
            "/api/v1/resources/",
            headers=owner_headers,
            json={
                "title": f"Bench Analyzer Slot {i}",
                "description": "Signal tester",
                "kind": "equipment",
                "category": "Electronics",
                "location": f"Station {i}",
                "status": "live",
                "approval_mode": "auto",
                "hourly_rate": 50.0,
                "pricing_model": "hourly",
                "currency": "₹",
                "max_hours_per_booking": 4,
                "max_hours_per_week_per_user": 200,
                "buffer_minutes": 0,
                "requirements": [],
                "availability_windows": [
                    {"weekday": d, "start_time": "08:00", "end_time": "20:00"}
                    for d in range(7)
                ],
                "blackout_dates": [],
                "managers": [],
            },
        )
        assert r_resp.status_code == 201
        resources.append(r_resp.json()["id"])

    # Fire 20 concurrent booking requests (1 hour each = 5,000 minor units)
    start_at = (datetime.now(timezone.utc) + timedelta(days=10)).replace(hour=10, minute=0, second=0, microsecond=0)
    end_at = start_at + timedelta(hours=1)

    tasks = [
        client.post(
            "/api/v1/bookings/",
            headers=user_headers,
            json={
                "resource_id": r_id,
                "start_at": start_at.isoformat(),
                "end_at": end_at.isoformat(),
                "purpose": f"Concurrent test reservation on {r_id[:6]}",
                "is_academic": True,
            },
        )
        for r_id in resources
    ]

    responses = await asyncio.gather(*tasks)
    status_codes = [r.status_code for r in responses]
    success_count = status_codes.count(201)
    failed_count = status_codes.count(400)

    # Exactly 10 must succeed (10 * 5,000 = 50,000 total balance), exactly 10 fail with 400
    assert success_count == 10
    assert failed_count == 10

    # Final wallet balance must be strictly 0 (never negative)
    final_wallet = await client.get("/api/v1/wallet/me", headers=user_headers)
    assert final_wallet.status_code == 200
    w_data = final_wallet.json()
    assert w_data["balance_minor_units"] == 0

    # Ledger sum must match balance exactly
    ledger_entries = w_data["entries"]
    assert sum(e["amount_minor_units"] for e in ledger_entries) == 0


