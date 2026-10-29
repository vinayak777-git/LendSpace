from typing import List, Optional
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.incident import Incident
from app.repositories.base import BaseRepository


class IncidentRepository(BaseRepository[Incident]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Incident, session)

    async def get_with_details(self, incident_id: str) -> Optional[Incident]:
        stmt = (
            select(Incident)
            .options(
                selectinload(Incident.booking),
                selectinload(Incident.resource),
                selectinload(Incident.reporter),
                selectinload(Incident.resolver),
            )
            .where(Incident.id == incident_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_filtered(
        self,
        resource_id: Optional[str] = None,
        booking_id: Optional[str] = None,
        status: Optional[str] = None,
        reported_by: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Incident]:
        stmt = (
            select(Incident)
            .options(
                selectinload(Incident.resource),
                selectinload(Incident.reporter),
                selectinload(Incident.resolver),
            )
            .order_by(desc(Incident.created_at))
            .limit(limit)
            .offset(offset)
        )
        if resource_id:
            stmt = stmt.where(Incident.resource_id == resource_id)
        if booking_id:
            stmt = stmt.where(Incident.booking_id == booking_id)
        if status:
            stmt = stmt.where(Incident.status == status)
        if reported_by:
            stmt = stmt.where(Incident.reported_by == reported_by)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())
