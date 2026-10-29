from datetime import datetime, timezone
import logging
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import async_session_maker
from app.models.audit import AuditEvent
from app.models.waitlist import WaitlistEntry

logger = logging.getLogger(__name__)


async def expire_stale_waitlist_entries(session: Optional[AsyncSession] = None) -> int:
    """Expire waitlist entries whose desired reservation period has passed."""
    now = datetime.now(timezone.utc)
    expired_count = 0

    async def _execute(s: AsyncSession) -> int:
        nonlocal expired_count
        stmt = select(WaitlistEntry).where(
            WaitlistEntry.status.in_(["waiting", "promoted"]),
            WaitlistEntry.desired_end < now,
        )
        result = await s.execute(stmt)
        entries = list(result.scalars().all())

        for entry in entries:
            entry.status = "expired"
            expired_count += 1

            audit = AuditEvent(
                actor_id=None,
                actor_role="system",
                action="WAITLIST_EXPIRED",
                entity_type="waitlist_entry",
                entity_id=entry.id,
                reason=f"Desired reservation end window ({entry.desired_end}) expired",
            )
            s.add(audit)

        if expired_count > 0:
            await s.flush()
            logger.info(f"Waitlist expiry job expired {expired_count} stale entries.")
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
            logger.error(f"Error executing waitlist expiry job: {e}", exc_info=True)
            return 0
