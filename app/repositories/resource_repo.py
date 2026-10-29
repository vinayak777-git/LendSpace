from typing import List, Optional
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.resource import (
    AvailabilityWindow,
    BlackoutDate,
    Resource,
    ResourceManager,
    ResourceRequirement,
)
from app.repositories.base import BaseRepository


class ResourceRepository(BaseRepository[Resource]):
    def __init__(self, session: AsyncSession):
        super().__init__(Resource, session)

    async def get_with_details(self, resource_id: str) -> Optional[Resource]:
        stmt = (
            select(Resource)
            .options(
                selectinload(Resource.owner),
                selectinload(Resource.requirements),
                selectinload(Resource.availability_windows),
                selectinload(Resource.blackout_dates),
                selectinload(Resource.managers),
            )
            .where(Resource.id == resource_id, Resource.is_deleted == False)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def list_filtered(
        self,
        query: Optional[str] = None,
        kind: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        owner_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Resource]:
        stmt = select(Resource).where(Resource.is_deleted == False)

        if owner_id:
            stmt = stmt.where(Resource.owner_id == owner_id)
        if status and status != "all":
            stmt = stmt.where(Resource.status == status)
        if kind and kind != "all":
            stmt = stmt.where(Resource.kind == kind)
        if category and category != "all":
            stmt = stmt.where(Resource.category == category)
        if query:
            q_pattern = f"%{query}%"
            stmt = stmt.where(
                or_(
                    Resource.title.ilike(q_pattern),
                    Resource.description.ilike(q_pattern),
                    Resource.location.ilike(q_pattern),
                    Resource.asset_tag.ilike(q_pattern),
                )
            )

        stmt = stmt.order_by(Resource.created_at.desc()).offset(skip).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def search_resources(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        kind: Optional[str] = None,
        status: Optional[str] = "live",
        owner_id: Optional[str] = None,
        min_capacity: Optional[int] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Resource]:
        stmt = select(Resource).where(Resource.is_deleted == False)
        if owner_id:
            stmt = stmt.where(Resource.owner_id == owner_id)
        if status and status != "all":
            stmt = stmt.where(Resource.status == status)
        if kind and kind != "all":
            stmt = stmt.where(Resource.kind == kind)
        if category and category != "all":
            stmt = stmt.where(Resource.category == category)
        if min_capacity is not None:
            stmt = stmt.where(Resource.capacity >= min_capacity)
        if query:
            q_pattern = f"%{query}%"
            stmt = stmt.where(
                or_(
                    Resource.title.ilike(q_pattern),
                    Resource.description.ilike(q_pattern),
                    Resource.location.ilike(q_pattern),
                    Resource.asset_tag.ilike(q_pattern),
                )
            )
        stmt = stmt.order_by(Resource.created_at.desc()).offset(offset).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def soft_delete(self, resource_id: str) -> bool:
        resource = await self.get_by_id(resource_id)
        if resource:
            resource.is_deleted = True
            await self.session.flush()
            return True
        return False
