from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.booking import Booking
from app.models.resource import Resource
from app.repositories.base import BaseRepository


class BookingRepository(BaseRepository[Booking]):
    def __init__(self, session: AsyncSession):
        super().__init__(Booking, session)

    async def get_overlapping_for_update(
        self,
        resource_id: str,
        start_at: datetime,
        end_at: datetime,
        exclude_id: Optional[str] = None,
        lock: bool = True,
    ) -> List[Booking]:
        """Fetch overlapping confirmed or pending bookings. Uses row-level lock (FOR UPDATE) when supported."""
        blocking_statuses = ["pending", "approved", "checked_in", "overdue"]

        stmt = select(Booking).where(
            Booking.resource_id == resource_id,
            Booking.status.in_(blocking_statuses),
            Booking.start_at < end_at,
            Booking.end_at > start_at,
        )

        if exclude_id:
            stmt = stmt.where(Booking.id != exclude_id)

        # Apply row-level locking for PostgreSQL concurrency protection
        # SQLite ignores with_for_update or handles transaction locks at file level
        if lock and not self.session.bind.dialect.name.startswith("sqlite"):
            stmt = stmt.with_for_update()

        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def get_with_details(self, booking_id: str) -> Optional[Booking]:
        stmt = (
            select(Booking)
            .options(
                selectinload(Booking.resource).selectinload(Resource.managers),
                selectinload(Booking.resource).selectinload(Resource.owner),
                selectinload(Booking.user),
                selectinload(Booking.condition_reports),
                selectinload(Booking.incidents),
            )
            .where(Booking.id == booking_id)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def list_by_user(self, user_id: str, status: Optional[str] = None) -> List[Booking]:
        stmt = (
            select(Booking)
            .options(selectinload(Booking.resource), selectinload(Booking.user))
            .where(Booking.user_id == user_id)
        )
        if status and status != "all":
            stmt = stmt.where(Booking.status == status)

        stmt = stmt.order_by(Booking.start_at.desc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def list_for_user(
        self, user_id: str, status: Optional[str] = None, limit: int = 50, offset: int = 0
    ) -> List[Booking]:
        stmt = (
            select(Booking)
            .options(selectinload(Booking.resource), selectinload(Booking.user))
            .where(Booking.user_id == user_id)
        )
        if status and status != "all":
            stmt = stmt.where(Booking.status == status)

        stmt = stmt.order_by(Booking.start_at.desc()).offset(offset).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def list_for_owner(
        self,
        owner_id: str,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Booking]:
        stmt = (
            select(Booking)
            .join(Resource, Booking.resource_id == Resource.id)
            .options(
                selectinload(Booking.user),
                selectinload(Booking.resource),
            )
            .where(Resource.owner_id == owner_id)
        )
        if status:
            stmt = stmt.where(Booking.status == status)

        stmt = stmt.order_by(Booking.created_at.desc()).offset(offset).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def list_by_resource(self, resource_id: str) -> List[Booking]:
        stmt = (
            select(Booking)
            .options(selectinload(Booking.user))
            .where(Booking.resource_id == resource_id)
            .order_by(Booking.start_at.asc())
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def list_for_resource(
        self,
        resource_id: str,
        start_after: Optional[datetime] = None,
        end_before: Optional[datetime] = None,
    ) -> List[Booking]:
        stmt = (
            select(Booking)
            .options(selectinload(Booking.user))
            .where(Booking.resource_id == resource_id)
        )
        if start_after:
            stmt = stmt.where(Booking.end_at >= start_after)
        if end_before:
            stmt = stmt.where(Booking.start_at <= end_before)

        stmt = stmt.order_by(Booking.start_at.asc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def list_overdue(self, now: datetime) -> List[Booking]:
        """Fetch sessions that are past their scheduled end time without return."""
        stmt = (
            select(Booking)
            .options(selectinload(Booking.resource), selectinload(Booking.user))
            .where(
                Booking.status == "checked_in",
                Booking.end_at < now,
            )
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def list_ending_soon(self, window_start: datetime, window_end: datetime) -> List[Booking]:
        """Fetch active sessions that are ending within a reminder window."""
        stmt = (
            select(Booking)
            .options(selectinload(Booking.resource), selectinload(Booking.user))
            .where(
                Booking.status.in_(["approved", "checked_in"]),
                Booking.end_at >= window_start,
                Booking.end_at <= window_end,
            )
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())
