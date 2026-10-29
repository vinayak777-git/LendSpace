from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_e2e_owner_booker_workflow(client: AsyncClient):
    """Prove the end-to-end workflow between two real distinct accounts:
    1. Owner registers & creates a real resource listing.
    2. Booker registers, discovers the listing, and submits a booking.
    3. Owner receives request with real booker identity, and approves it.
    4. Booker sees confirmed approved status.
    """
    # 1. Owner registers
    owner_reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "dr_alice_owner@university.edu",
            "password": "OwnerSecretPassword123!",
            "full_name": "Dr. Alice Vance",
            "business_name": "Robotics Research Facility",
            "phone": "+1-555-0100",
            "role": "owner",
        },
    )
    assert owner_reg.status_code == 201
    owner_token = owner_reg.json()["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}

    # 2. Owner creates a new listing
    res_resp = await client.post(
        "/api/v1/resources/",
        headers=owner_headers,
        json={
            "title": "Precision 5-Axis CNC Mill",
            "description": "High tolerance metal fabrication milling machine",
            "kind": "equipment",
            "category": "Machining",
            "location": "Robotics Wing - Bay 04",
            "status": "live",
            "approval_mode": "manual",
            "hourly_rate": 350.0,
            "daily_rate": 2200.0,
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
    resource = res_resp.json()
    resource_id = resource["id"]
    assert resource["title"] == "Precision 5-Axis CNC Mill"

    # 3. Booker registers
    booker_reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "brian_student@university.edu",
            "password": "StudentPassword123!",
            "full_name": "Brian Student",
            "phone": "+1-555-0200",
            "role": "booker",
        },
    )
    assert booker_reg.status_code == 201
    booker_data = booker_reg.json()
    booker_token = booker_data["access_token"]
    booker_headers = {"Authorization": f"Bearer {booker_token}"}

    # 4. Booker discovers the resource
    discover_resp = await client.get("/api/v1/resources/?query=CNC", headers=booker_headers)
    assert discover_resp.status_code == 200
    listed_resources = discover_resp.json()
    assert any(r["id"] == resource_id for r in listed_resources)

    # 4b. Booker tops up platform credits
    topup_resp = await client.post(
        "/api/v1/wallet/topup",
        headers=booker_headers,
        json={"amount_credits": 1000},
    )
    assert topup_resp.status_code == 200
    assert topup_resp.json()["success"] is True

    # 5. Booker submits a reservation request
    target_start = (datetime.now(timezone.utc) + timedelta(days=2)).replace(hour=10, minute=0, second=0, microsecond=0)
    target_end = target_start + timedelta(hours=2)

    book_resp = await client.post(
        "/api/v1/bookings/",
        headers=booker_headers,
        json={
            "resource_id": resource_id,
            "start_at": target_start.isoformat(),
            "end_at": target_end.isoformat(),
            "purpose": "Aero foil titanium prototype machining",
            "is_academic": True,
        },
    )
    assert book_resp.status_code == 201
    booking = book_resp.json()
    assert booking["status"] == "pending"
    assert booking["payment_status"] == "held"
    booking_id = booking["id"]

    # 6. Owner views reservation requests
    owner_reqs_resp = await client.get("/api/v1/bookings/owner", headers=owner_headers)
    assert owner_reqs_resp.status_code == 200
    owner_bookings = owner_reqs_resp.json()
    assert any(b["id"] == booking_id for b in owner_bookings)

    # Check real applicant details are present
    target_req = next(b for b in owner_bookings if b["id"] == booking_id)
    assert target_req["user"]["full_name"] == "Brian Student"
    assert target_req["user"]["email"] == "brian_student@university.edu"

    # 7. Owner approves booking
    approve_resp = await client.post(
        f"/api/v1/bookings/{booking_id}/action?target_status=approved",
        headers=owner_headers,
        json={"reason": "Safety briefing verified, tooling assigned."},
    )
    assert approve_resp.status_code == 200
    assert approve_resp.json()["status"] == "approved"

    # 8. Booker checks their bookings and sees "approved"
    my_bookings_resp = await client.get("/api/v1/bookings/me", headers=booker_headers)
    assert my_bookings_resp.status_code == 200
    my_list = my_bookings_resp.json()
    my_booking = next(b for b in my_list if b["id"] == booking_id)
    assert my_booking["status"] == "approved"

    # 9. Booker attempts to double-book overlapping slot -> rejected with 409
    dup_book = await client.post(
        "/api/v1/bookings/",
        headers=booker_headers,
        json={
            "resource_id": resource_id,
            "start_at": (target_start + timedelta(minutes=30)).isoformat(),
            "end_at": (target_end + timedelta(minutes=30)).isoformat(),
            "purpose": "Double book overlapping slot attempt",
            "is_academic": True,
        },
    )
    assert dup_book.status_code == 409
    assert "reasons" in dup_book.json()["detail"] or "conflict" in dup_book.text.lower()

    # 10. Booker attempts to book outside availability windows (e.g. 02:00 to 04:00 AM) -> rejected with 409
    outside_start = (datetime.now(timezone.utc) + timedelta(days=3)).replace(hour=2, minute=0, second=0, microsecond=0)
    outside_end = outside_start + timedelta(hours=2)
    outside_book = await client.post(
        "/api/v1/bookings/",
        headers=booker_headers,
        json={
            "resource_id": resource_id,
            "start_at": outside_start.isoformat(),
            "end_at": outside_end.isoformat(),
            "purpose": "Night booking outside availability",
        },
    )
    assert outside_book.status_code == 409

    # 11. Check-in and return lifecycle
    checkin_resp = await client.post(
        f"/api/v1/bookings/{booking_id}/action?target_status=checked_in",
        headers=booker_headers,
        json={"reason": "Badge scanned at laboratory bay terminal"},
    )
    assert checkin_resp.status_code == 200

    return_resp = await client.post(
        f"/api/v1/bookings/{booking_id}/action?target_status=returned",
        headers=owner_headers,
        json={"reason": "Clean return, coolant refilled, checklist OK"},
    )
    assert return_resp.status_code == 200
    assert return_resp.json()["status"] == "returned"
    assert return_resp.json()["payment_status"] == "released"

    # 12. Booker reviews resource
    rev_resp = await client.post(
        "/api/v1/reviews/",
        headers=booker_headers,
        json={
            "booking_id": booking_id,
            "rating": 5,
            "comment": "Flawless CNC tolerances and pristine clean tooling!",
        },
    )
    assert rev_resp.status_code == 201
    assert rev_resp.json()["rating"] == 5
