from typing import List, Optional
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditEvent


class AuditRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def log_event(self, event: AuditEvent) -> AuditEvent:
        self.session.add(event)
        # Session commit will occur in the unit-of-work
        return event

    async def list_events(
        self,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        booking_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[AuditEvent]:
        stmt = (
            select(AuditEvent)
            .order_by(desc(AuditEvent.created_at))
            .limit(limit)
            .offset(offset)
        )
        if entity_type:
            stmt = stmt.where(AuditEvent.entity_type == entity_type)
        if entity_id:
            stmt = stmt.where(AuditEvent.entity_id == entity_id)
        if booking_id:
            stmt = stmt.where(AuditEvent.booking_id == booking_id)
        if actor_id:
            stmt = stmt.where(AuditEvent.actor_id == actor_id)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())
