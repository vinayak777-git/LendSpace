from typing import List, Optional
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.condition_report import ConditionReport
from app.repositories.base import BaseRepository


class ConditionReportRepository(BaseRepository[ConditionReport]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(ConditionReport, session)

    async def get_by_booking_and_phase(
        self, booking_id: str, phase: str
    ) -> Optional[ConditionReport]:
        stmt = (
            select(ConditionReport)
            .options(selectinload(ConditionReport.recorder))
            .where(
                ConditionReport.booking_id == booking_id,
                ConditionReport.phase == phase,
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_booking(self, booking_id: str) -> List[ConditionReport]:
        stmt = (
            select(ConditionReport)
            .options(selectinload(ConditionReport.recorder))
            .where(ConditionReport.booking_id == booking_id)
            .order_by(desc(ConditionReport.recorded_at))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
