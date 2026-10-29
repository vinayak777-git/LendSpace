from datetime import datetime
from typing import Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.ledger import UsageLedger
from app.repositories.base import BaseRepository


class UsageLedgerRepository(BaseRepository[UsageLedger]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(UsageLedger, session)

    async def get_weekly_usage_hours(
        self, user_id: str, resource_id: str, week_start: datetime
    ) -> float:
        stmt = (
            select(func.coalesce(func.sum(UsageLedger.hours), 0.0))
            .where(
                UsageLedger.user_id == user_id,
                UsageLedger.resource_id == resource_id,
                UsageLedger.week_start == week_start,
            )
        )
        result = await self.session.execute(stmt)
        return float(result.scalar_one())

    async def record_usage(
        self,
        user_id: str,
        resource_id: str,
        booking_id: Optional[str],
        hours: float,
        week_start: datetime,
    ) -> UsageLedger:
        entry = UsageLedger(
            user_id=user_id,
            resource_id=resource_id,
            booking_id=booking_id,
            hours=hours,
            week_start=week_start,
        )
        return await self.create(entry)
