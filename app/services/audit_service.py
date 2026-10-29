from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditEvent
from app.repositories.audit_repo import AuditRepository


class AuditService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.audit_repo = AuditRepository(session)

    async def list_events(
        self,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        booking_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[AuditEvent]:
        return await self.audit_repo.list_events(
            entity_type=entity_type,
            entity_id=entity_id,
            booking_id=booking_id,
            actor_id=actor_id,
            limit=limit,
            offset=offset,
        )
