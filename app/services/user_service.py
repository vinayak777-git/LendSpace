from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.errors import NotFoundError, PermissionDeniedError
from app.models.audit import AuditEvent
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserUpdate


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.user_repo = UserRepository(session)
        self.audit_repo = AuditRepository(session)

    async def get_user(self, user_id: str) -> User:
        user = await self.user_repo.get_by_id(user_id)
        if not user or user.is_deleted:
            raise NotFoundError("User not found", entity="User", entity_id=user_id)
        return user

    async def update_profile(
        self,
        user_id: str,
        update_data: UserUpdate,
        actor: User,
        ip: Optional[str] = None,
    ) -> User:
        user = await self.get_user(user_id)
        if actor.id != user.id and actor.role != "admin":
            raise PermissionDeniedError("Cannot update another user's profile.")

        update_dict: Dict[str, Any] = {}
        if update_data.full_name is not None:
            update_dict["full_name"] = update_data.full_name.strip()
        if update_data.privacy_settings is not None:
            # Merge privacy settings
            current_settings = dict(user.privacy_settings or {})
            current_settings.update(update_data.privacy_settings)
            update_dict["privacy_settings"] = current_settings

        before_state = {"full_name": user.full_name, "privacy_settings": user.privacy_settings}
        updated = await self.user_repo.update(user, update_dict)

        audit = AuditEvent(
            actor_id=actor.id,
            actor_role=actor.role,
            action="USER_PROFILE_UPDATED",
            entity_type="user",
            entity_id=user.id,
            before=before_state,
            after=update_dict,
            reason="User updated profile settings",
            ip=ip,
        )
        await self.audit_repo.log_event(audit)
        return updated

    async def update_status(
        self,
        user_id: str,
        status: str,
        actor: User,
        reason: str,
        ip: Optional[str] = None,
    ) -> User:
        if actor.role != "admin":
            raise PermissionDeniedError("Only administrators can modify user account status.")

        user = await self.get_user(user_id)
        before_status = user.status
        updated = await self.user_repo.update(user, {"status": status})

        audit = AuditEvent(
            actor_id=actor.id,
            actor_role=actor.role,
            action="USER_STATUS_CHANGED",
            entity_type="user",
            entity_id=user.id,
            before={"status": before_status},
            after={"status": status},
            reason=reason,
            ip=ip,
        )
        await self.audit_repo.log_event(audit)
        return updated

    async def list_users(
        self,
        role: Optional[str] = None,
        org_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[User]:
        return await self.user_repo.list_active(
            role=role, org_id=org_id, limit=limit, offset=offset
        )
