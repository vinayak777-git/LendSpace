from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.errors import ConflictError, NotFoundError, PermissionDeniedError
from app.core.security import hash_password
from app.models.audit import AuditEvent
from app.models.resource import Resource, ResourceManager
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.repositories.resource_repo import ResourceRepository
from app.repositories.user_repo import UserRepository
from app.schemas.team import TeamMemberInvite, TeamMemberUpdate


class TeamService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.resource_repo = ResourceRepository(session)
        self.user_repo = UserRepository(session)
        self.audit_repo = AuditRepository(session)

    async def invite_or_add_member(
        self,
        resource_id: str,
        data: TeamMemberInvite,
        actor: User,
        ip: Optional[str] = None,
    ) -> ResourceManager:
        resource = await self.resource_repo.get_by_id(resource_id)
        if not resource:
            raise NotFoundError("Resource not found", entity="Resource", entity_id=resource_id)

        if actor.role != "admin" and resource.owner_id != actor.id:
            raise PermissionDeniedError("Only the resource owner or an admin can manage the team.")

        # Find or create user
        user = await self.user_repo.get_by_email(data.email)
        if not user:
            user = User(
                email=data.email.lower().strip(),
                password_hash=hash_password("TemporaryPass123!"),
                full_name=data.full_name.strip(),
                role=data.role,
                org_id=actor.org_id,
                status="active",
            )
            user = await self.user_repo.create(user)

        # Check if already a manager
        stmt = select(ResourceManager).where(
            ResourceManager.resource_id == resource_id,
            ResourceManager.user_id == user.id,
        )
        res = await self.session.execute(stmt)
        existing = res.scalar_one_or_none()
        if existing:
            raise ConflictError("User is already assigned to this resource's management team.")

        mgr = ResourceManager(
            resource_id=resource_id,
            user_id=user.id,
            can_approve=data.can_approve,
            can_confirm_returns=data.can_confirm_returns,
            can_handle_incidents=data.can_handle_incidents,
        )
        self.session.add(mgr)

        audit = AuditEvent(
            actor_id=actor.id,
            actor_role=actor.role,
            action="TEAM_MEMBER_ADDED",
            entity_type="resource_manager",
            entity_id=user.id,
            reason=f"Added {user.full_name} to management team for '{resource.title}'",
            ip=ip,
        )
        await self.audit_repo.log_event(audit)

        return mgr

    async def list_members(self, resource_id: str) -> List[ResourceManager]:
        stmt = select(ResourceManager).where(ResourceManager.resource_id == resource_id)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def remove_member(
        self,
        resource_id: str,
        user_id: str,
        actor: User,
        ip: Optional[str] = None,
    ) -> bool:
        resource = await self.resource_repo.get_by_id(resource_id)
        if not resource:
            raise NotFoundError("Resource not found", entity="Resource", entity_id=resource_id)

        if actor.role != "admin" and resource.owner_id != actor.id:
            raise PermissionDeniedError("Only the resource owner or an admin can remove team members.")

        stmt = select(ResourceManager).where(
            ResourceManager.resource_id == resource_id,
            ResourceManager.user_id == user_id,
        )
        res = await self.session.execute(stmt)
        mgr = res.scalar_one_or_none()
        if not mgr:
            raise NotFoundError("Manager not assigned to this resource.")

        await self.session.delete(mgr)

        audit = AuditEvent(
            actor_id=actor.id,
            actor_role=actor.role,
            action="TEAM_MEMBER_REMOVED",
            entity_type="resource_manager",
            entity_id=user_id,
            reason=f"Removed manager from '{resource.title}'",
            ip=ip,
        )
        await self.audit_repo.log_event(audit)
        return True
