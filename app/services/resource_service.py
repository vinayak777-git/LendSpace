from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.errors import NotFoundError, PermissionDeniedError
from app.models.audit import AuditEvent
from app.models.resource import (
    AvailabilityWindow,
    BlackoutDate,
    Resource,
    ResourceManager,
    ResourceRequirement,
)
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.repositories.resource_repo import ResourceRepository
from app.schemas.resource import BlackoutDateSchema, ResourceCreate, ResourceUpdate


class ResourceService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.resource_repo = ResourceRepository(session)
        self.audit_repo = AuditRepository(session)

    def _check_manage_permission(self, resource: Resource, actor: User) -> bool:
        if actor.role == "admin" or resource.owner_id == actor.id:
            return True
        manager_user_ids = {m.user_id for m in resource.managers}
        return actor.id in manager_user_ids

    async def get_resource_details(self, resource_id: str) -> Resource:
        resource = await self.resource_repo.get_with_details(resource_id)
        if not resource or resource.is_deleted:
            raise NotFoundError("Resource not found", entity="Resource", entity_id=resource_id)
        return resource

    async def create_resource(
        self, data: ResourceCreate, owner: User, ip: Optional[str] = None
    ) -> Resource:
        if owner.role not in ["owner", "admin"]:
            raise PermissionDeniedError("Only space/equipment owners and admins can create resources.")

        resource = Resource(
            owner_id=owner.id,
            org_id=owner.org_id,
            kind=data.kind,
            title=data.title.strip(),
            description=data.description.strip(),
            category=data.category.strip(),
            location=data.location.strip(),
            building=data.building.strip() if data.building else None,
            room=data.room.strip() if data.room else None,
            capacity=data.capacity,
            asset_tag=data.asset_tag,
            condition_notes=data.condition_notes,
            images=data.images,
            status=data.status,
            approval_mode=data.approval_mode,
            supervision_required=data.supervision_required,
            deposit_amount=data.deposit_amount,
            max_hours_per_booking=data.max_hours_per_booking,
            max_hours_per_week_per_user=data.max_hours_per_week_per_user,
            cooldown_hours=data.cooldown_hours,
            max_advance_days=data.max_advance_days,
            buffer_minutes=data.buffer_minutes,
            allowed_audience=data.allowed_audience,
            waitlist_enabled=data.waitlist_enabled,
            safety_notes=data.safety_notes,
            usage_rules=data.usage_rules,
            condition_checklist=data.condition_checklist,
            hourly_rate=data.hourly_rate,
            daily_rate=data.daily_rate,
            pricing_model=data.pricing_model,
            currency=data.currency,
            area_sq_ft=data.area_sq_ft,
        )

        for req in data.requirements:
            resource.requirements.append(
                ResourceRequirement(
                    type=req.type,
                    name=req.name,
                    required_credential_name=req.required_credential_name,
                )
            )

        for win in data.availability_windows:
            resource.availability_windows.append(
                AvailabilityWindow(
                    weekday=win.weekday,
                    start_time=win.start_time,
                    end_time=win.end_time,
                )
            )

        for bo in data.blackout_dates:
            resource.blackout_dates.append(
                BlackoutDate(
                    start_at=bo.start_at,
                    end_at=bo.end_at,
                    reason=bo.reason,
                )
            )

        for mgr in data.managers:
            resource.managers.append(
                ResourceManager(
                    user_id=mgr.user_id,
                    can_approve=mgr.can_approve,
                    can_confirm_returns=mgr.can_confirm_returns,
                    can_handle_incidents=mgr.can_handle_incidents,
                )
            )

        created = await self.resource_repo.create(resource)

        audit = AuditEvent(
            actor_id=owner.id,
            actor_role=owner.role,
            action="RESOURCE_CREATED",
            entity_type="resource",
            entity_id=created.id,
            reason=f"Resource '{created.title}' created with status {created.status}",
            after={"title": created.title, "category": created.category, "kind": created.kind},
            ip=ip,
        )
        await self.audit_repo.log_event(audit)
        return created

    async def update_resource(
        self,
        resource_id: str,
        data: ResourceUpdate,
        actor: User,
        ip: Optional[str] = None,
    ) -> Resource:
        resource = await self.get_resource_details(resource_id)
        if not self._check_manage_permission(resource, actor):
            raise PermissionDeniedError("You do not have permission to modify this resource.")

        update_dict = data.model_dump(exclude_unset=True)
        if not update_dict:
            return resource

        before_state = {k: getattr(resource, k) for k in update_dict.keys()}
        updated = await self.resource_repo.update(resource, update_dict)

        audit = AuditEvent(
            actor_id=actor.id,
            actor_role=actor.role,
            action="RESOURCE_UPDATED",
            entity_type="resource",
            entity_id=resource.id,
            before=before_state,
            after=update_dict,
            reason=f"Resource '{resource.title}' settings updated",
            ip=ip,
        )
        await self.audit_repo.log_event(audit)
        return updated

    async def delete_resource(
        self, resource_id: str, actor: User, ip: Optional[str] = None
    ) -> bool:
        resource = await self.get_resource_details(resource_id)
        if actor.role != "admin" and resource.owner_id != actor.id:
            raise PermissionDeniedError("Only the owner or an admin can delete this resource.")

        success = await self.resource_repo.soft_delete(resource_id)
        if success:
            audit = AuditEvent(
                actor_id=actor.id,
                actor_role=actor.role,
                action="RESOURCE_DELETED",
                entity_type="resource",
                entity_id=resource_id,
                reason=f"Resource '{resource.title}' soft-deleted",
                ip=ip,
            )
            await self.audit_repo.log_event(audit)
        return success

    async def add_blackout(
        self,
        resource_id: str,
        blackout: BlackoutDateSchema,
        actor: User,
        ip: Optional[str] = None,
    ) -> Resource:
        resource = await self.get_resource_details(resource_id)
        if not self._check_manage_permission(resource, actor):
            raise PermissionDeniedError("You do not have permission to modify this resource.")

        bo_model = BlackoutDate(
            resource_id=resource_id,
            start_at=blackout.start_at,
            end_at=blackout.end_at,
            reason=blackout.reason,
        )
        self.session.add(bo_model)

        audit = AuditEvent(
            actor_id=actor.id,
            actor_role=actor.role,
            action="RESOURCE_BLACKOUT_ADDED",
            entity_type="resource",
            entity_id=resource_id,
            reason=f"Added blackout: {blackout.reason}",
            ip=ip,
        )
        await self.audit_repo.log_event(audit)
        return await self.get_resource_details(resource_id)

    async def list_resources(
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
        return await self.resource_repo.search_resources(
            query=query,
            category=category,
            kind=kind,
            status=status,
            owner_id=owner_id,
            min_capacity=min_capacity,
            limit=limit,
            offset=offset,
        )
