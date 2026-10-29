from datetime import datetime, timezone
import logging
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import async_session_maker
from app.models.audit import AuditEvent
from app.models.booking import Booking
from app.models.notification import Notification

logger = logging.getLogger(__name__)


async def detect_overdue_bookings(session: Optional[AsyncSession] = None) -> int:
    """Detect bookings that have passed their scheduled end time without return, transitioning them to overdue."""
    now = datetime.now(timezone.utc)
    overdue_count = 0

    async def _execute(s: AsyncSession) -> int:
        nonlocal overdue_count
        stmt = select(Booking).where(
            Booking.status == "checked_in",
            Booking.end_at < now,
        )
        result = await s.execute(stmt)
        overdue_bookings = list(result.scalars().all())

        for booking in overdue_bookings:
            booking.status = "overdue"
            overdue_count += 1

            audit = AuditEvent(
                actor_id=None,
                actor_role="system",
                action="BOOKING_OVERDUE",
                entity_type="booking",
                entity_id=booking.id,
                booking_id=booking.id,
                reason=f"Automated background scan: session expired at {booking.end_at}",
            )
            s.add(audit)

            notif = Notification(
                user_id=booking.user_id,
                type="booking_overdue",
                title="Action Required: Booking Overdue",
                body="Your scheduled reservation has passed its end time. Please return the asset and complete checkout immediately.",
                entity_type="booking",
                entity_id=booking.id,
            )
            s.add(notif)

        if overdue_count > 0:
            await s.flush()
            logger.info(f"Overdue detector flagged {overdue_count} bookings as overdue.")
        return overdue_count

    if session is not None:
        return await _execute(session)

    async with async_session_maker() as s:
        try:
            count = await _execute(s)
            await s.commit()
            return count
        except Exception as e:
            await s.rollback()
            logger.error(f"Error executing overdue booking detection job: {e}", exc_info=True)
            return 0
