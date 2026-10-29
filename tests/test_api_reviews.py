from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_reviews_lifecycle_and_rating_update(client: AsyncClient, seed_test_data):
    user = seed_test_data["user"]
    owner = seed_test_data["owner"]
    user_headers = auth_headers(user.id, "user", str(user.org_id))
    owner_headers = auth_headers(owner.id, "owner", str(owner.org_id))

    # 1. Create a free test resource
    res_resp = await client.post(
        "/api/v1/resources/",
        headers=owner_headers,
        json={
            "title": "Stereo Microscope 40x-1000x",
            "description": "High resolution inspection microscope",
            "kind": "equipment",
            "category": "Microscopy",
            "location": "Biology Lab 04",
            "status": "live",
            "approval_mode": "auto",
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
    resource_id = res_resp.json()["id"]

    # 2. Book resource
    start_at = (datetime.now(timezone.utc) + timedelta(days=7)).replace(hour=10, minute=0, second=0, microsecond=0)
    end_at = start_at + timedelta(hours=2)

    book_resp = await client.post(
        "/api/v1/bookings/",
        headers=user_headers,
        json={
            "resource_id": resource_id,
            "start_at": start_at.isoformat(),
            "end_at": end_at.isoformat(),
            "purpose": "Biological slide inspection",
            "is_academic": True,
        },
    )
    booking_id = book_resp.json()["id"]

    # 3. Attempting to review an approved booking must fail with HTTP 400
    early_rev = await client.post(
        "/api/v1/reviews/",
        headers=user_headers,
        json={
            "booking_id": booking_id,
            "rating": 5,
            "comment": "Too early review",
        },
    )
    assert early_rev.status_code == 400

    # 4. Progress booking: checked_in -> returned
    await client.post(
        f"/api/v1/bookings/{booking_id}/action?target_status=checked_in",
        headers=user_headers,
        json={"reason": "Started session"},
    )
    await client.post(
        f"/api/v1/bookings/{booking_id}/action?target_status=returned",
        headers=user_headers,
        json={"reason": "Finished session and cleaned lens"},
    )

    # 5. Successfully submit a 5-star review
    rev_resp = await client.post(
        "/api/v1/reviews/",
        headers=user_headers,
        json={
            "booking_id": booking_id,
            "rating": 5,
            "comment": "Excellent optics, pristine condition!",
        },
    )
    assert rev_resp.status_code == 201
    rev_data = rev_resp.json()
    assert rev_data["rating"] == 5
    assert rev_data["comment"] == "Excellent optics, pristine condition!"

    # 6. Duplicate review for the same booking must fail with HTTP 409
    dup_rev = await client.post(
        "/api/v1/reviews/",
        headers=user_headers,
        json={
            "booking_id": booking_id,
            "rating": 4,
            "comment": "Trying to review again",
        },
    )
    assert dup_rev.status_code == 409

    # 7. List reviews for resource
    res_revs = await client.get(f"/api/v1/reviews/resource/{resource_id}")
    assert res_revs.status_code == 200
    reviews_list = res_revs.json()
    assert len(reviews_list) == 1
    assert reviews_list[0]["author_name"] == "Test Student"

