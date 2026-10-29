from datetime import datetime, timedelta, timezone
import logging
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.db.session import async_session_maker
from app.models.audit import AuditEvent
from app.models.booking import Booking
from app.models.notification import Notification
from app.services.payment_service import PaymentService

logger = logging.getLogger(__name__)


async def autocomplete_finished_bookings_and_settle(session: Optional[AsyncSession] = None) -> int:
    """Auto-completes finished bookings that passed checkout buffer and releases escrow."""
    now = datetime.now(timezone.utc)
    completed_count = 0

    async def _execute(s: AsyncSession) -> int:
        nonlocal completed_count
        # Bookings ended more than 1 hour ago without incident report
        threshold = now - timedelta(hours=1)
        stmt = (
            select(Booking)
            .options(selectinload(Booking.resource), selectinload(Booking.user))
            .where(
                Booking.status.in_(["approved", "checked_in"]),
                Booking.end_at < threshold,
            )
        )
        if not s.bind.dialect.name.startswith("sqlite"):
            stmt = stmt.with_for_update(skip_locked=True)

        res = await s.execute(stmt)
        finished_bookings = list(res.scalars().all())

        payment_service = PaymentService(s)

        for b in finished_bookings:
            b.status = "returned"
            b.returned_at = now
            completed_count += 1

            # Settle escrow: pay rent to owner, refund deposit to booker
            await payment_service.release_escrow(b, actor=b.user)

            # Increment completed count & platform verification
            b.user.completed_bookings_count += 1
            b.user.is_verified_by_platform = True

            stmt_owner = select(Booking).options(selectinload(Booking.resource)).where(Booking.id == b.id)
            if b.resource and b.resource.owner:
                b.resource.owner.completed_bookings_count += 1
                b.resource.owner.is_verified_by_platform = True

            audit = AuditEvent(
                actor_id=None,
                actor_role="system",
                action="BOOKING_AUTO_COMPLETED",
                entity_type="booking",
                entity_id=b.id,
                reason="Automatic completion after session elapsed without reported issue",
            )
            s.add(audit)

            notif = Notification(
                user_id=b.user_id,
                type="booking_completed",
                title="Reservation Completed",
                body=f"Your reservation for {b.resource.title} is completed. Escrow has been settled and deposit returned.",
                entity_type="booking",
                entity_id=b.id,
            )
            s.add(notif)

        if completed_count > 0:
            await s.flush()
            logger.info(f"Auto-completed {completed_count} finished reservations.")
        return completed_count

    if session is not None:
        return await _execute(session)

    async with async_session_maker() as s:
        try:
            count = await _execute(s)
            await s.commit()
            return count
        except Exception as e:
            await s.rollback()
            logger.error(f"Error in auto-completion job: {e}", exc_info=True)
            return 0

