from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.errors import ConflictError, NotFoundError, PermissionDeniedError
from app.models.audit import AuditEvent
from app.models.notification import Notification
from app.models.user import User
from app.models.waitlist import WaitlistEntry
from app.repositories.audit_repo import AuditRepository
from app.repositories.notification_repo import NotificationRepository
from app.repositories.resource_repo import ResourceRepository
from app.repositories.waitlist_repo import WaitlistRepository
from app.rules.fairness import calculate_priority_score
from app.schemas.waitlist import WaitlistEntryCreate


class WaitlistService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.waitlist_repo = WaitlistRepository(session)
        self.resource_repo = ResourceRepository(session)
        self.audit_repo = AuditRepository(session)
        self.notif_repo = NotificationRepository(session)

    async def join_waitlist(
        self, data: WaitlistEntryCreate, user: User, ip: Optional[str] = None
    ) -> WaitlistEntry:
        resource = await self.resource_repo.get_by_id(data.resource_id)
        if not resource or resource.is_deleted:
            raise NotFoundError("Resource not found", entity="Resource", entity_id=data.resource_id)

        if not resource.waitlist_enabled:
            raise ConflictError("Waitlisting is not enabled for this resource.")

        # Check existing waiting entries
        existing_user_entries = await self.waitlist_repo.list_for_user(user.id, status="waiting")
        for e in existing_user_entries:
            if e.resource_id == data.resource_id and not (
                data.desired_end <= e.desired_start or data.desired_start >= e.desired_end
            ):
                raise ConflictError("You already have an active waitlist entry for this time slot.")

        active_entries = await self.waitlist_repo.list_active_for_resource(data.resource_id)
        position = len(active_entries) + 1

        score, breakdown = calculate_priority_score(
            purpose=data.purpose,
            is_academic=data.is_academic,
            has_safety_badge=False,
            hours_used_this_week=0.0,
            waiting_hours=0.0,
            strikes_count=0,
        )

        entry = WaitlistEntry(
            resource_id=data.resource_id,
            user_id=user.id,
            desired_start=data.desired_start,
            desired_end=data.desired_end,
            position=position,
            priority_score=score,
            score_breakdown=breakdown,
            status="waiting",
        )
        created = await self.waitlist_repo.create(entry)

        audit = AuditEvent(
            actor_id=user.id,
            actor_role=user.role,
            action="WAITLIST_JOINED",
            entity_type="waitlist_entry",
            entity_id=created.id,
            reason=f"Joined waitlist for resource '{resource.title}' at position {position}",
            ip=ip,
            after={"position": position, "priority_score": score},
        )
        await self.audit_repo.log_event(audit)

        notif = Notification(
            user_id=user.id,
            type="waitlist_joined",
            title="Waitlist Position Confirmed",
            body=f"You are currently #{position} in line for {resource.title}.",
            entity_type="resource",
            entity_id=resource.id,
        )
        await self.notif_repo.create(notif)

        return created

    async def leave_waitlist(
        self, entry_id: str, actor: User, ip: Optional[str] = None
    ) -> bool:
        entry = await self.waitlist_repo.get_by_id(entry_id)
        if not entry:
            raise NotFoundError("Waitlist entry not found", entity="WaitlistEntry", entity_id=entry_id)

        if actor.id != entry.user_id and actor.role not in ["owner", "admin"]:
            raise PermissionDeniedError("Cannot cancel another user's waitlist entry.")

        before_status = entry.status
        updated = await self.waitlist_repo.update(entry, {"status": "cancelled"})

        audit = AuditEvent(
            actor_id=actor.id,
            actor_role=actor.role,
            action="WAITLIST_CANCELLED",
            entity_type="waitlist_entry",
            entity_id=entry.id,
            before={"status": before_status},
            after={"status": "cancelled"},
            reason="User cancelled waitlist reservation",
            ip=ip,
        )
        await self.audit_repo.log_event(audit)
        return True

    async def promote_next_candidate(
        self, resource_id: str, slot_start: datetime, slot_end: datetime
    ) -> Optional[WaitlistEntry]:
        active_entries = await self.waitlist_repo.list_active_for_resource(resource_id)
        # Find candidates whose desired interval overlaps with freed slot
        candidates = [
            e
            for e in active_entries
            if e.desired_start < slot_end and e.desired_end > slot_start and e.status == "waiting"
        ]
        if not candidates:
            return None

        # Sort candidate by highest priority score, then earliest creation
        candidates.sort(key=lambda x: (-x.priority_score, x.created_at))
        promoted = candidates[0]

        await self.waitlist_repo.update(promoted, {"status": "promoted"})

        audit = AuditEvent(
            actor_id=None,
            actor_role="system",
            action="WAITLIST_PROMOTED",
            entity_type="waitlist_entry",
            entity_id=promoted.id,
            reason=f"Auto-promoted waitlist position due to booking cancellation in slot [{slot_start} - {slot_end}]",
        )
        await self.audit_repo.log_event(audit)

        notif = Notification(
            user_id=promoted.user_id,
            type="waitlist_promoted",
            title="Slot Available - Waitlist Promoted!",
            body="A reservation slot just opened up for your requested time. Please confirm your booking immediately.",
            entity_type="waitlist_entry",
            entity_id=promoted.id,
        )
        await self.notif_repo.create(notif)
        return promoted

    async def list_for_resource(self, resource_id: str) -> List[WaitlistEntry]:
        return await self.waitlist_repo.list_active_for_resource(resource_id)

    async def list_for_user(self, user_id: str) -> List[WaitlistEntry]:
        return await self.waitlist_repo.list_for_user(user_id)
