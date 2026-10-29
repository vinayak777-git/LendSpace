from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, session: AsyncSession):
        super().__init__(User, session)

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email.lower(), User.is_deleted == False)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_by_id_active(self, user_id: str) -> Optional[User]:
        stmt = select(User).where(User.id == user_id, User.is_deleted == False)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def list_by_role(self, role: str) -> List[User]:
        stmt = select(User).where(User.role == role, User.is_deleted == False)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def list_active(
        self,
        role: Optional[str] = None,
        org_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[User]:
        stmt = select(User).where(User.is_deleted == False).offset(offset).limit(limit)
        if role:
            stmt = stmt.where(User.role == role)
        if org_id:
            stmt = stmt.where(User.org_id == org_id)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())
