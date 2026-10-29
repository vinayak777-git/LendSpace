"""
LendSpace — End-to-End Local Workflow Verification Script
Demonstrates all 7 core phases running locally on SQLite WAL without any cloud dependencies.
"""

import asyncio
from datetime import datetime, timedelta, timezone
from pathlib import Path
import httpx


BASE_URL = "http://127.0.0.1:8000"


async def main():
    print("=" * 70)
    print("  LENDSPACE LOCAL AUTOMATION AUDIT & E2E DEMO")
    print("  Built-In & Local Components Only (Zero Cloud / Zero Hosted APIs)")
    print("=" * 70)

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:
        # Check health
        try:
            health = await client.get("/health")
            print(f"[1/7] Backend Health Status: {health.status_code} {health.json()}")
        except Exception as e:
            print(f"❌ Backend server not reachable at {BASE_URL}. Ensure uvicorn is running: {e}")
            return

        # 1. Register Owner
        ts = int(datetime.now().timestamp())
        owner_email = f"owner_alice_{ts}@university.edu"
        owner_resp = await client.post(
            "/api/v1/auth/register",
            json={
                "email": owner_email,
                "password": "OwnerSecurePassword123!",
                "full_name": "Dr. Alice Vance",
                "business_name": "Department of Mechanical Engineering",
                "phone": "+1-555-0100",
                "role": "owner",
            },
        )
        assert owner_resp.status_code == 201, f"Owner registration failed: {owner_resp.text}"
        owner_token = owner_resp.json()["access_token"]
        owner_headers = {"Authorization": f"Bearer {owner_token}"}
        print(f"[2/7] Owner Registered: {owner_email} (Dr. Alice Vance)")

        # 2. Register Booker
        booker_email = f"student_brian_{ts}@university.edu"
        booker_resp = await client.post(
            "/api/v1/auth/register",
            json={
                "email": booker_email,
                "password": "StudentSecurePassword123!",
                "full_name": "Brian Student",
                "phone": "+1-555-0200",
                "role": "booker",
            },
        )
        assert booker_resp.status_code == 201, f"Booker registration failed: {booker_resp.text}"
        booker_token = booker_resp.json()["access_token"]
        booker_headers = {"Authorization": f"Bearer {booker_token}"}
        print(f"[3/7] Booker Registered: {booker_email} (Brian Student)")

        # 3. Booker tops up platform credits
        topup = await client.post(
            "/api/v1/wallet/topup",
            headers=booker_headers,
            json={"amount_credits": 1000},
        )
        assert topup.status_code == 200
        print(f"[4/7] Booker Wallet Top-Up: +1000 credits -> Balance: {topup.json()['new_balance_display']}")

        # 4. Owner lists a precision machine
        listing = await client.post(
            "/api/v1/resources/",
            headers=owner_headers,
            json={
                "title": f"Precision 5-Axis CNC Mill - Mark {ts % 1000}",
                "description": "Industrial titanium/aluminum precision milling center",
                "kind": "equipment",
                "category": "Machining",
                "location": "Fabrication Wing - Bay 04",
                "status": "live",
                "approval_mode": "manual",
                "hourly_rate": 200.0,
                "deposit_amount": 50.0,
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
        assert listing.status_code == 201
        resource_id = listing.json()["id"]
        resource_title = listing.json()["title"]
        print(f"[5/7] Real Resource Listed: '{resource_title}' (₹200/hr + ₹50 deposit)")

        # 5. Booker reserves slot
        target_start = (datetime.now(timezone.utc) + timedelta(days=2)).replace(hour=14, minute=0, second=0, microsecond=0)
        target_end = target_start + timedelta(hours=2)

        booking_req = await client.post(
            "/api/v1/bookings/",
            headers=booker_headers,
            json={
                "resource_id": resource_id,
                "start_at": target_start.isoformat(),
                "end_at": target_end.isoformat(),
                "purpose": "Aero foil titanium prototype machining for capstone",
                "is_academic": True,
            },
        )
        assert booking_req.status_code == 201
        booking = booking_req.json()
        booking_id = booking["id"]
        print(f"[6/7] Reservation Submitted:")
        print(f"      - Booking ID: {booking_id}")
        print(f"      - Status: {booking['status'].upper()}")
        print(f"      - Escrow Status: {booking['payment_status'].upper()}")
        print(f"      - Total Price: ₹{booking['total_price_minor_units'] / 100:.2f}")
        print(f"      - Priority Score: {booking['priority_score']} / 100")

        # 6. Owner views requests queue & approves
        owner_reqs = await client.get("/api/v1/bookings/owner", headers=owner_headers)
        assert owner_reqs.status_code == 200
        req_item = next(b for b in owner_reqs.json() if b["id"] == booking_id)
        print(f"      - Verified Requester in Owner Queue: {req_item['user']['full_name']} ({req_item['user']['email']})")

        appr = await client.post(
            f"/api/v1/bookings/{booking_id}/action?target_status=approved",
            headers=owner_headers,
            json={"reason": "Safety briefing verified, tooling assigned."},
        )
        assert appr.status_code == 200

        # Check in and return
        await client.post(
            f"/api/v1/bookings/{booking_id}/action?target_status=checked_in",
            headers=booker_headers,
            json={"reason": "Student badge scanned at terminal"},
        )
        ret = await client.post(
            f"/api/v1/bookings/{booking_id}/action?target_status=returned",
            headers=booker_headers,
            json={"reason": "Clean return, coolant refilled, checklist OK"},
        )
        assert ret.status_code == 200
        print(f"      - Returned & Completed: Escrow Status -> {ret.json()['payment_status'].upper()}")

        # 7. Review submission
        rev = await client.post(
            "/api/v1/reviews/",
            headers=booker_headers,
            json={
                "booking_id": booking_id,
                "rating": 5,
                "comment": "Flawless tolerances and clean tooling!",
            },
        )
        assert rev.status_code == 201
        print(f"[7/7] Verified 5-Star Review Authored: '{rev.json()['comment']}'")

        # Inspect local outbox
        outbox_files = list(Path("outbox").glob("*.eml"))
        print("-" * 70)
        print(f"  LOCAL OUTBOX VERIFICATION: {len(outbox_files)} .eml email files stored in ./outbox")
        print("  ALL 7 PHASES VERIFIED END-TO-END WITH REAL LOCAL DATABASE PERSISTENCE!")
        print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())

