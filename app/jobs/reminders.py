from datetime import datetime, timedelta, timezone
import logging
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.db.session import async_session_maker
from app.models.booking import Booking
from app.models.notification import Notification
from app.services.outbox_service import OutboxService

logger = logging.getLogger(__name__)


async def send_upcoming_booking_reminders(session: Optional[AsyncSession] = None) -> int:
    """Send reminders to users with approved bookings starting in the next 1-2 hours."""
    now = datetime.now(timezone.utc)
    reminder_window_start = now
    reminder_window_end = now + timedelta(hours=2)
    reminders_sent = 0

    async def _execute(s: AsyncSession) -> int:
        nonlocal reminders_sent
        stmt = (
            select(Booking)
            .options(selectinload(Booking.user), selectinload(Booking.resource))
            .where(
                Booking.status == "approved",
                Booking.start_at >= reminder_window_start,
                Booking.start_at <= reminder_window_end,
            )
        )
        result = await s.execute(stmt)
        upcoming_bookings = list(result.scalars().all())

        outbox_svc = OutboxService(s)

        for booking in upcoming_bookings:
            # Check if reminder notification was already dispatched
            notif_check = select(Notification).where(
                Notification.user_id == booking.user_id,
                Notification.entity_id == booking.id,
                Notification.type == "booking_reminder",
            )
            existing = (await s.execute(notif_check)).scalar_one_or_none()
            if not existing:
                res_title = booking.resource.title if booking.resource else "your reserved resource"
                notif = Notification(
                    user_id=booking.user_id,
                    type="booking_reminder",
                    title="Upcoming Reservation Reminder",
                    body=f"Your scheduled reservation for '{res_title}' begins at {booking.start_at.strftime('%H:%M UTC')}. Remember to conduct pre-use inspection.",
                    entity_type="booking",
                    entity_id=booking.id,
                )
                s.add(notif)

                if booking.user and booking.user.email:
                    await outbox_svc.enqueue_email(
                        to_email=booking.user.email,
                        subject=f"LendSpace Reminder: Upcoming Reservation for {res_title}",
                        body=(
                            f"Hello {booking.user.full_name},\n\n"
                            f"This is a reminder that your reservation for '{res_title}' starts soon at "
                            f"{booking.start_at.strftime('%Y-%m-%d %H:%M UTC')}.\n\n"
                            f"Please arrive on time and complete the pre-check inspection in your dashboard.\n\n"
                            f"Regards,\nLendSpace Platform"
                        ),
                        user_id=booking.user_id,
                    )

                reminders_sent += 1

        if reminders_sent > 0:
            await s.commit()
            logger.info(f"Sent {reminders_sent} upcoming reservation reminders.")
        return reminders_sent

    if session:
        return await _execute(session)
    async with async_session_maker() as s:
        return await _execute(s)
