from datetime import datetime
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.waitlist import WaitlistEntry
from app.repositories.base import BaseRepository


class WaitlistRepository(BaseRepository[WaitlistEntry]):
    def __init__(self, session: AsyncSession):
        super().__init__(WaitlistEntry, session)

    async def list_active_for_resource(self, resource_id: str) -> List[WaitlistEntry]:
        stmt = (
            select(WaitlistEntry)
            .options(selectinload(WaitlistEntry.user))
            .where(
                WaitlistEntry.resource_id == resource_id,
                WaitlistEntry.status == "waiting",
            )
            .order_by(WaitlistEntry.priority_score.desc(), WaitlistEntry.created_at.asc())
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def list_by_user(self, user_id: str) -> List[WaitlistEntry]:
        stmt = (
            select(WaitlistEntry)
            .options(selectinload(WaitlistEntry.resource))
            .where(WaitlistEntry.user_id == user_id)
            .order_by(WaitlistEntry.created_at.desc())
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def list_expired(self, now: datetime) -> List[WaitlistEntry]:
        stmt = select(WaitlistEntry).where(
            WaitlistEntry.status == "waiting",
            WaitlistEntry.desired_start < now,
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())
