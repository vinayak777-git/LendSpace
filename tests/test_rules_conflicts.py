from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock
from app.rules.conflicts import check_conflicts


def test_inverted_time_rejected():
    resource = MagicMock(max_hours_per_booking=4, max_advance_days=14, buffer_minutes=15)
    now = datetime.now(timezone.utc)
    start = now + timedelta(hours=2)
    end = now + timedelta(hours=1)

    res = check_conflicts(resource, start, end, existing_bookings=[])
    assert res["has_conflict"] is True
    assert "strictly after" in res["reasons"][0]


def test_exceeding_max_duration_rejected():
    resource = MagicMock(max_hours_per_booking=3, max_advance_days=14, buffer_minutes=15)
    now = datetime.now(timezone.utc)
    start = now + timedelta(days=1, hours=1)
    end = start + timedelta(hours=5)

    res = check_conflicts(resource, start, end, existing_bookings=[])
    assert res["has_conflict"] is True
    assert any("Exceeds max allowed duration" in r for r in res["reasons"])


def test_blackout_date_overlap_conflict():
    resource = MagicMock(max_hours_per_booking=4, max_advance_days=14, buffer_minutes=15)
    now = datetime.now(timezone.utc)
    start = now + timedelta(days=2, hours=10)
    end = start + timedelta(hours=2)

    bo = MagicMock(
        start_at=start - timedelta(hours=1),
        end_at=end + timedelta(hours=1),
        reason="Scheduled Calibration",
    )
    res = check_conflicts(resource, start, end, existing_bookings=[], blackout_dates=[bo])
    assert res["has_conflict"] is True
    assert any("Scheduled Calibration" in r for r in res["reasons"])


def test_existing_approved_booking_overlap_generates_alternatives():
    resource = MagicMock(
        max_hours_per_booking=4,
        max_advance_days=14,
        buffer_minutes=15,
        availability_windows=[],
    )
    now = datetime.now(timezone.utc)
    start = now + timedelta(days=1, hours=10)
    end = start + timedelta(hours=2)

    existing = MagicMock(
        id="book-1",
        status="approved",
        start_at=start,
        end_at=end,
    )
    res = check_conflicts(resource, start, end, existing_bookings=[existing])
    assert res["has_conflict"] is True
    assert any("conflicts with an existing reservation" in r for r in res["reasons"])
    # Suggested alternative slots should be provided
    assert len(res["suggested_slots"]) > 0
