from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.errors import NotFoundError, PermissionDeniedError
from app.models.audit import AuditEvent
from app.models.condition_report import ConditionReport
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.repositories.booking_repo import BookingRepository
from app.repositories.condition_repo import ConditionReportRepository
from app.schemas.condition_report import ConditionReportCreate


class ConditionService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.condition_repo = ConditionReportRepository(session)
        self.booking_repo = BookingRepository(session)
        self.audit_repo = AuditRepository(session)

    async def submit_report(
        self,
        data: ConditionReportCreate,
        user: User,
        ip: Optional[str] = None,
    ) -> ConditionReport:
        booking = await self.booking_repo.get_with_details(data.booking_id)
        if not booking:
            raise NotFoundError("Booking not found", entity="Booking", entity_id=data.booking_id)

        # Booker, resource owner, manager, or admin can submit
        is_manager = user.role in ["owner", "admin"] or any(
            m.user_id == user.id for m in booking.resource.managers
        )
        if user.id != booking.user_id and not is_manager:
            raise PermissionDeniedError("You do not have permission to file condition reports for this reservation.")

        report = ConditionReport(
            booking_id=data.booking_id,
            phase=data.phase,
            checklist=data.checklist,
            notes=data.notes,
            photo_paths=data.photo_paths,
            recorded_by=user.id,
            recorded_at=datetime.now(timezone.utc),
        )
        created = await self.condition_repo.create(report)

        audit = AuditEvent(
            actor_id=user.id,
            actor_role=user.role,
            action=f"CONDITION_REPORT_{data.phase.upper()}",
            entity_type="condition_report",
            entity_id=created.id,
            booking_id=booking.id,
            reason=f"Recorded {data.phase} condition inspection report",
            ip=ip,
            after={"phase": data.phase, "photo_count": len(data.photo_paths)},
        )
        await self.audit_repo.log_event(audit)

        return created

    async def get_by_phase(
        self, booking_id: str, phase: str
    ) -> Optional[ConditionReport]:
        return await self.condition_repo.get_by_booking_and_phase(booking_id, phase)

    async def list_by_booking(self, booking_id: str) -> List[ConditionReport]:
        return await self.condition_repo.list_by_booking(booking_id)
