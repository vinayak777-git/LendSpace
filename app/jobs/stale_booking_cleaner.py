from datetime import datetime, timezone
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


async def expire_stale_bookings_and_release_holds(session: Optional[AsyncSession] = None) -> int:
    """Expires pending reservations whose start time has already passed, releasing escrow holds."""
    now = datetime.now(timezone.utc)
    expired_count = 0

    async def _execute(s: AsyncSession) -> int:
        nonlocal expired_count
        stmt = (
            select(Booking)
            .options(selectinload(Booking.resource), selectinload(Booking.user))
            .where(Booking.status == "pending", Booking.start_at < now)
        )
        if not s.bind.dialect.name.startswith("sqlite"):
            stmt = stmt.with_for_update(skip_locked=True)

        res = await s.execute(stmt)
        stale_bookings = list(res.scalars().all())

        payment_service = PaymentService(s)

        for b in stale_bookings:
            b.status = "expired"
            expired_count += 1

            # Refund escrow hold if any
            await payment_service.refund_escrow(b, reason="Reservation start window elapsed without approval", actor=b.user)

            audit = AuditEvent(
                actor_id=None,
                actor_role="system",
                action="BOOKING_EXPIRED",
                entity_type="booking",
                entity_id=b.id,
                reason=f"Scheduled start {b.start_at} passed without confirmation",
            )
            s.add(audit)

            notif = Notification(
                user_id=b.user_id,
                type="booking_expired",
                title="Reservation Request Expired",
                body=f"Your request for {b.resource.title} expired because it was not confirmed before its start time.",
                entity_type="booking",
                entity_id=b.id,
            )
            s.add(notif)

        if expired_count > 0:
            await s.flush()
            logger.info(f"Expired {expired_count} stale pending reservations and settled holds.")
        return expired_count

    if session is not None:
        return await _execute(session)

    async with async_session_maker() as s:
        try:
            count = await _execute(s)
            await s.commit()
            return count
        except Exception as e:
            await s.rollback()
            logger.error(f"Error expiring stale bookings: {e}", exc_info=True)
            return 0

