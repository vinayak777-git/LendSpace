from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.errors import NotFoundError, PermissionDeniedError
from app.models.audit import AuditEvent
from app.models.incident import Incident
from app.models.notification import Notification
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.repositories.booking_repo import BookingRepository
from app.repositories.incident_repo import IncidentRepository
from app.repositories.notification_repo import NotificationRepository
from app.repositories.resource_repo import ResourceRepository
from app.repositories.user_repo import UserRepository
from app.schemas.incident import IncidentCreate, IncidentResolve


class IncidentService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.incident_repo = IncidentRepository(session)
        self.resource_repo = ResourceRepository(session)
        self.booking_repo = BookingRepository(session)
        self.user_repo = UserRepository(session)
        self.audit_repo = AuditRepository(session)
        self.notif_repo = NotificationRepository(session)

    async def report_incident(
        self,
        data: IncidentCreate,
        reporter: User,
        ip: Optional[str] = None,
    ) -> Incident:
        resource = await self.resource_repo.get_by_id(data.resource_id)
        if not resource:
            raise NotFoundError("Resource not found", entity="Resource", entity_id=data.resource_id)

        # If linked to a booking, check booking and optionally set to disputed if returned
        if data.booking_id:
            booking = await self.booking_repo.get_by_id(data.booking_id)
            if booking and booking.status == "returned":
                await self.booking_repo.update(booking, {"status": "disputed"})
                audit_b = AuditEvent(
                    actor_id=reporter.id,
                    actor_role=reporter.role,
                    action="BOOKING_DISPUTED",
                    entity_type="booking",
                    entity_id=booking.id,
                    booking_id=booking.id,
                    reason=f"Incident filed ({data.type}) on returned booking",
                    ip=ip,
                )
                await self.audit_repo.log_event(audit_b)

        incident = Incident(
            booking_id=data.booking_id,
            resource_id=data.resource_id,
            reported_by=reporter.id,
            type=data.type,
            severity=data.severity,
            description=data.description.strip(),
            status="open",
        )
        created = await self.incident_repo.create(incident)

        audit = AuditEvent(
            actor_id=reporter.id,
            actor_role=reporter.role,
            action="INCIDENT_REPORTED",
            entity_type="incident",
            entity_id=created.id,
            booking_id=data.booking_id,
            reason=f"Filed {data.severity} severity incident ({data.type})",
            ip=ip,
            after={
                "type": data.type,
                "severity": data.severity,
                "description": data.description,
            },
        )
        await self.audit_repo.log_event(audit)

        # Notify resource owner
        owner_notif = Notification(
            user_id=resource.owner_id,
            type="incident_reported",
            title=f"Incident Reported: {resource.title}",
            body=f"A {data.severity} {data.type} issue was filed by {reporter.full_name}: {data.description}",
            entity_type="incident",
            entity_id=created.id,
        )
        await self.notif_repo.create(owner_notif)

        return created

    async def resolve_incident(
        self,
        incident_id: str,
        data: IncidentResolve,
        resolver: User,
        ip: Optional[str] = None,
    ) -> Incident:
        if resolver.role not in ["owner", "manager", "admin"]:
            raise PermissionDeniedError("Insufficient permissions to adjudicate incidents.")

        incident = await self.incident_repo.get_with_details(incident_id)
        if not incident:
            raise NotFoundError("Incident not found", entity="Incident", entity_id=incident_id)

        before_status = incident.status
        updated = await self.incident_repo.update(
            incident,
            {
                "status": "resolved",
                "resolution": data.resolution,
                "resolution_reason": data.resolution_reason,
                "resolved_by": resolver.id,
                "summary": data.summary,
            },
        )

        # If resolution is suspension, suspend the reported booker
        if data.resolution == "access_suspension" and incident.booking:
            target_user = await self.user_repo.get_by_id(incident.booking.user_id)
            if target_user:
                await self.user_repo.update(target_user, {"status": "suspended"})
                audit_susp = AuditEvent(
                    actor_id=resolver.id,
                    actor_role=resolver.role,
                    action="USER_SUSPENDED",
                    entity_type="user",
                    entity_id=target_user.id,
                    reason=f"Suspended following incident resolution: {data.resolution_reason}",
                    ip=ip,
                )
                await self.audit_repo.log_event(audit_susp)

        # If booking was disputed, close it
        if incident.booking and incident.booking.status == "disputed":
            await self.booking_repo.update(incident.booking, {"status": "closed"})

        audit = AuditEvent(
            actor_id=resolver.id,
            actor_role=resolver.role,
            action="INCIDENT_RESOLVED",
            entity_type="incident",
            entity_id=incident.id,
            booking_id=incident.booking_id,
            before={"status": before_status},
            after={"status": "resolved", "resolution": data.resolution},
            reason=data.resolution_reason,
            ip=ip,
        )
        await self.audit_repo.log_event(audit)

        # Notify reporter
        notif = Notification(
            user_id=incident.reported_by,
            type="incident_resolved",
            title="Incident Adjudicated",
            body=f"Incident resolution: {data.resolution}. Note: {data.resolution_reason}",
            entity_type="incident",
            entity_id=incident.id,
        )
        await self.notif_repo.create(notif)

        return updated

    async def get_incident(self, incident_id: str) -> Incident:
        incident = await self.incident_repo.get_with_details(incident_id)
        if not incident:
            raise NotFoundError("Incident not found", entity="Incident", entity_id=incident_id)
        return incident

    async def list_incidents(
        self,
        resource_id: Optional[str] = None,
        booking_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Incident]:
        return await self.incident_repo.list_filtered(
            resource_id=resource_id,
            booking_id=booking_id,
            status=status,
            limit=limit,
            offset=offset,
        )
