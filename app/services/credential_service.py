from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.errors import NotFoundError, PermissionDeniedError
from app.models.audit import AuditEvent
from app.models.credential import Credential
from app.models.notification import Notification
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.repositories.credential_repo import CredentialRepository
from app.repositories.notification_repo import NotificationRepository
from app.schemas.credential import CredentialCreate, CredentialReview


class CredentialService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.cred_repo = CredentialRepository(session)
        self.audit_repo = AuditRepository(session)
        self.notif_repo = NotificationRepository(session)

    async def submit_credential(
        self,
        user_id: str,
        data: CredentialCreate,
        actor: User,
        ip: Optional[str] = None,
    ) -> Credential:
        if actor.id != user_id and actor.role != "admin":
            raise PermissionDeniedError("Cannot submit credentials on behalf of another user.")

        cred = Credential(
            user_id=user_id,
            type=data.type,
            name=data.name.strip(),
            document_path=data.document_path,
            expiry_date=data.expiry_date,
            status="pending",
        )
        created = await self.cred_repo.create(cred)

        audit = AuditEvent(
            actor_id=actor.id,
            actor_role=actor.role,
            action="CREDENTIAL_SUBMITTED",
            entity_type="credential",
            entity_id=created.id,
            reason=f"Submitted credential '{created.name}' for verification",
            after={"type": created.type, "name": created.name, "status": "pending"},
            ip=ip,
        )
        await self.audit_repo.log_event(audit)
        return created

    async def review_credential(
        self,
        credential_id: str,
        review: CredentialReview,
        reviewer: User,
        ip: Optional[str] = None,
    ) -> Credential:
        if reviewer.role not in ["owner", "manager", "admin"]:
            raise PermissionDeniedError("Insufficient permissions to review credentials.")

        cred = await self.cred_repo.get_by_id(credential_id)
        if not cred:
            raise NotFoundError("Credential not found", entity="Credential", entity_id=credential_id)

        before_status = cred.status
        cred.status = review.status
        cred.reviewed_by = reviewer.id
        cred.review_reason = review.review_reason

        updated = await self.cred_repo.update(
            cred,
            {
                "status": review.status,
                "reviewed_by": reviewer.id,
                "review_reason": review.review_reason,
            },
        )

        audit = AuditEvent(
            actor_id=reviewer.id,
            actor_role=reviewer.role,
            action="CREDENTIAL_REVIEWED",
            entity_type="credential",
            entity_id=updated.id,
            before={"status": before_status},
            after={"status": updated.status, "reason": review.review_reason},
            reason=f"Credential reviewed: {review.status}",
            ip=ip,
        )
        await self.audit_repo.log_event(audit)

        notif = Notification(
            user_id=updated.user_id,
            type="credential_reviewed",
            title=f"Credential {review.status.capitalize()}",
            body=f"Your credential '{updated.name}' has been {review.status}. Reason: {review.review_reason or 'No reason provided.'}",
            entity_type="credential",
            entity_id=updated.id,
        )
        await self.notif_repo.create(notif)

        return updated

    async def list_for_user(self, user_id: str) -> List[Credential]:
        return await self.cred_repo.list_for_user(user_id)

    async def list_pending(self, limit: int = 50) -> List[Credential]:
        return await self.cred_repo.list_pending(limit=limit)
