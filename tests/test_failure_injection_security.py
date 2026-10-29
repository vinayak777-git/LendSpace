from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_expired_and_forged_jwt(client: AsyncClient):
    # 1. Completely forged JWT token
    forged_headers = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature"}
    resp = await client.get("/api/v1/users/me", headers=forged_headers)
    assert resp.status_code == 401
    assert "detail" in resp.json()

    # 2. Garbage header
    resp_bad = await client.get("/api/v1/users/me", headers={"Authorization": "NotBearer xyz"})
    assert resp_bad.status_code == 401


@pytest.mark.asyncio
async def test_rbac_booker_cannot_call_owner_endpoints(client: AsyncClient, seed_test_data):
    user = seed_test_data["user"]
    user_headers = auth_headers(user.id, "user", str(user.org_id))

    # Booker attempts to access owner earnings endpoint
    resp = await client.get("/api/v1/wallet/owner/earnings", headers=user_headers)
    assert resp.status_code == 403
    assert "Operation requires one of roles" in resp.json()["detail"] or "forbidden" in resp.json()["detail"].lower()

    # Booker attempts to access owner review queue
    queue_resp = await client.get("/api/v1/bookings/owner", headers=user_headers)
    assert queue_resp.status_code == 403


@pytest.mark.asyncio
async def test_tenant_isolation_cannot_access_other_user_wallet(client: AsyncClient, seed_test_data):
    user = seed_test_data["user"]
    owner = seed_test_data["owner"]
    user_headers = auth_headers(user.id, "user", str(user.org_id))
    owner_headers = auth_headers(owner.id, "owner", str(owner.org_id))

    # Top up user wallet
    await client.post(
        "/api/v1/wallet/topup",
        headers=user_headers,
        json={"amount_credits": 100},
    )

    # Owner checks their wallet, should see only their own wallet (balance 0, not user's 100)
    owner_wallet = await client.get("/api/v1/wallet/me", headers=owner_headers)
    assert owner_wallet.status_code == 200
    assert owner_wallet.json()["balance_minor_units"] == 0


@pytest.mark.asyncio
async def test_sql_injection_and_xss_in_text_fields(client: AsyncClient, seed_test_data):
    user = seed_test_data["user"]
    owner = seed_test_data["owner"]
    user_headers = auth_headers(user.id, "user", str(user.org_id))
    owner_headers = auth_headers(owner.id, "owner", str(owner.org_id))

    sqli_title = "'; DROP TABLE resources; -- <script>alert('xss')</script>"
    res_resp = await client.post(
        "/api/v1/resources/",
        headers=owner_headers,
        json={
            "title": sqli_title,
            "description": "SQLi & XSS payload resilience verification",
            "kind": "equipment",
            "category": "Testing",
            "location": "Room <svg onload=alert(1)>",
            "status": "live",
            "approval_mode": "manual",
            "hourly_rate": 0.0,
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
    assert res_resp.status_code == 201
    resource_id = res_resp.json()["id"]

    # Verify query doesn't execute SQL injection; table remains intact
    check_resp = await client.get(f"/api/v1/resources/{resource_id}", headers=user_headers)
    assert check_resp.status_code == 200
    assert check_resp.json()["title"] == sqli_title

    # Book with SQL injection in purpose
    start_at = (datetime.now(timezone.utc) + timedelta(days=8)).replace(hour=10, minute=0, second=0, microsecond=0)
    end_at = start_at + timedelta(hours=2)

    sqli_purpose = "Research OR 1=1; DELETE FROM users; --"
    book_resp = await client.post(
        "/api/v1/bookings/",
        headers=user_headers,
        json={
            "resource_id": resource_id,
            "start_at": start_at.isoformat(),
            "end_at": end_at.isoformat(),
            "purpose": sqli_purpose,
            "is_academic": True,
        },
    )
    assert book_resp.status_code == 201
    assert book_resp.json()["purpose"] == sqli_purpose

    # Verify users table still exists and is untouched
    users_check = await client.get("/api/v1/users/me", headers=user_headers)
    assert users_check.status_code == 200
