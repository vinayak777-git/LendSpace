from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification
from app.repositories.notification_repo import NotificationRepository


class NotificationService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.notif_repo = NotificationRepository(session)

    async def list_notifications(
        self, user_id: str, unread_only: bool = False, limit: int = 50
    ) -> List[Notification]:
        return await self.notif_repo.list_for_user(
            user_id=user_id, unread_only=unread_only, limit=limit
        )

    async def mark_read(self, notification_id: str, user_id: str) -> bool:
        return await self.notif_repo.mark_as_read(notification_id, user_id)

    async def mark_all_read(self, user_id: str) -> int:
        return await self.notif_repo.mark_all_as_read(user_id)
