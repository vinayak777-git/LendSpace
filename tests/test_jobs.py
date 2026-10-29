from datetime import datetime, timedelta, timezone
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.jobs.auto_completer import autocomplete_finished_bookings_and_settle
from app.jobs.overdue_detector import detect_overdue_bookings
from app.jobs.reminders import send_upcoming_booking_reminders
from app.jobs.stale_booking_cleaner import expire_stale_bookings_and_release_holds
from app.jobs.waitlist_expiry import expire_stale_waitlist_entries
from app.models.booking import Booking
from app.models.notification import Notification
from app.models.outbox import EmailOutbox
from app.models.waitlist import WaitlistEntry
from app.models.wallet import Wallet


@pytest.mark.asyncio
async def test_overdue_detector_job(db_session: AsyncSession, seed_test_data):
    user = seed_test_data["user"]
    resource = seed_test_data["resource"]

    # Past session that was checked_in but not returned
    now = datetime.now(timezone.utc)
    booking = Booking(
        resource_id=resource.id,
        user_id=user.id,
        start_at=now - timedelta(hours=3),
        end_at=now - timedelta(hours=1),
        purpose="Past session",
        status="checked_in",
    )
    db_session.add(booking)
    await db_session.commit()

    # Run detector with test session
    count = await detect_overdue_bookings(session=db_session)
    assert count >= 1

    # Verify status changed to overdue
    stmt = select(Booking).where(Booking.id == booking.id)
    refreshed = (await db_session.execute(stmt)).scalar_one()
    assert refreshed.status == "overdue"


@pytest.mark.asyncio
async def test_waitlist_expiry_job(db_session: AsyncSession, seed_test_data):
    user = seed_test_data["user"]
    resource = seed_test_data["resource"]

    # Stale waitlist entry in the past
    now = datetime.now(timezone.utc)
    entry = WaitlistEntry(
        resource_id=resource.id,
        user_id=user.id,
        desired_start=now - timedelta(hours=5),
        desired_end=now - timedelta(hours=2),
        position=1,
        priority_score=50,
        score_breakdown={},
        status="waiting",
    )
    db_session.add(entry)
    await db_session.commit()

    # Run expiry job with test session
    expired_count = await expire_stale_waitlist_entries(session=db_session)
    assert expired_count >= 1

    stmt = select(WaitlistEntry).where(WaitlistEntry.id == entry.id)
    refreshed = (await db_session.execute(stmt)).scalar_one()
    assert refreshed.status == "expired"


@pytest.mark.asyncio
async def test_reminders_job_and_outbox(db_session: AsyncSession, seed_test_data):
    user = seed_test_data["user"]
    resource = seed_test_data["resource"]

    # Booking starting in 1 hour
    now = datetime.now(timezone.utc)
    booking = Booking(
        resource_id=resource.id,
        user_id=user.id,
        start_at=now + timedelta(hours=1),
        end_at=now + timedelta(hours=2),
        purpose="Upcoming lab session",
        status="approved",
    )
    db_session.add(booking)
    await db_session.commit()

    reminders = await send_upcoming_booking_reminders(session=db_session)
    assert reminders >= 1

    # Verify notification created
    stmt_notif = select(Notification).where(
        Notification.user_id == user.id,
        Notification.entity_id == booking.id,
        Notification.type == "booking_reminder",
    )
    notif = (await db_session.execute(stmt_notif)).scalar_one_or_none()
    assert notif is not None
    assert "Upcoming Reservation Reminder" in notif.title

    # Verify outbox record created
    stmt_outbox = select(EmailOutbox).where(
        EmailOutbox.user_id == user.id,
        EmailOutbox.subject.contains("Upcoming Reservation"),
    )
    outbox = (await db_session.execute(stmt_outbox)).scalar_one_or_none()
    assert outbox is not None
    assert outbox.to_email == user.email


@pytest.mark.asyncio
async def test_stale_booking_cleaner_job(db_session: AsyncSession, seed_test_data):
    user = seed_test_data["user"]
    resource = seed_test_data["resource"]

    # Pending booking whose start time is 2 hours in the past
    now = datetime.now(timezone.utc)
    booking = Booking(
        resource_id=resource.id,
        user_id=user.id,
        start_at=now - timedelta(hours=2),
        end_at=now - timedelta(hours=1),
        purpose="Unconfirmed booking",
        status="pending",
        payment_status="held",
        total_price_minor_units=10000,
    )
    db_session.add(booking)
    await db_session.commit()

    count = await expire_stale_bookings_and_release_holds(session=db_session)
    assert count >= 1

    stmt = select(Booking).where(Booking.id == booking.id)
    refreshed = (await db_session.execute(stmt)).scalar_one()
    assert refreshed.status == "expired"


@pytest.mark.asyncio
async def test_auto_completer_and_settlement_job(db_session: AsyncSession, seed_test_data):
    user = seed_test_data["user"]
    resource = seed_test_data["resource"]

    # Approved booking whose end time was 3 hours ago
    now = datetime.now(timezone.utc)
    booking = Booking(
        resource_id=resource.id,
        user_id=user.id,
        start_at=now - timedelta(hours=5),
        end_at=now - timedelta(hours=3),
        purpose="Finished session",
        status="checked_in",
        payment_status="held",
        total_price_minor_units=5000,
        deposit_minor_units=2000,
    )
    db_session.add(booking)
    await db_session.commit()

    count = await autocomplete_finished_bookings_and_settle(session=db_session)
    assert count >= 1

    stmt = select(Booking).where(Booking.id == booking.id)
    refreshed = (await db_session.execute(stmt)).scalar_one()
    assert refreshed.status == "returned"
    assert refreshed.returned_at is not None

