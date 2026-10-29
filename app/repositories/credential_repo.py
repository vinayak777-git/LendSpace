from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.credential import Credential
from app.repositories.base import BaseRepository


class CredentialRepository(BaseRepository[Credential]):
    def __init__(self, session: AsyncSession):
        super().__init__(Credential, session)

    async def list_by_user(self, user_id: str) -> List[Credential]:
        stmt = select(Credential).where(Credential.user_id == user_id).order_by(Credential.created_at.desc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def list_for_user(self, user_id: str) -> List[Credential]:
        return await self.list_by_user(user_id)

    async def list_pending_review(self) -> List[Credential]:
        stmt = (
            select(Credential)
            .options(selectinload(Credential.user))
            .where(Credential.status == "pending")
            .order_by(Credential.created_at.asc())
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def list_pending(self, limit: int = 50) -> List[Credential]:
        return await self.list_pending_review()
