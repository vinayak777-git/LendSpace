from typing import Any, Dict, List
from fastapi import APIRouter, Body, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_client_ip, require_roles
from app.core.errors import NotFoundError
from app.db.session import get_db
from app.jobs.auto_completer import autocomplete_finished_bookings_and_settle
from app.jobs.overdue_detector import detect_overdue_bookings
from app.jobs.reminders import send_upcoming_booking_reminders
from app.jobs.scheduler import scheduler
from app.jobs.stale_booking_cleaner import expire_stale_bookings_and_release_holds
from app.jobs.waitlist_expiry import expire_stale_waitlist_entries
from app.models.audit import AuditEvent
from app.models.booking import Booking
from app.models.incident import Incident
from app.models.resource import Resource
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserRead

router = APIRouter(prefix="/admin", tags=["Admin Portal"])


@router.get(
    "/stats",
    summary="High-level platform counts and health statistics",
)
async def get_admin_stats(
    current_user: User = Depends(require_roles("admin")),
    session: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    users_count = (await session.execute(select(func.count(User.id)))).scalar_one()
    resources_count = (await session.execute(select(func.count(Resource.id)))).scalar_one()
    bookings_count = (await session.execute(select(func.count(Booking.id)))).scalar_one()
    incidents_count = (await session.execute(select(func.count(Incident.id)))).scalar_one()
    audit_count = (await session.execute(select(func.count(AuditEvent.id)))).scalar_one()

    return {
        "users": users_count,
        "resources": resources_count,
        "bookings": bookings_count,
        "incidents": incidents_count,
        "audit_events": audit_count,
    }


@router.get(
    "/jobs/status",
    summary="List all registered background scheduler jobs and their next run times",
)
async def get_jobs_status(
    current_user: User = Depends(require_roles("admin")),
) -> List[Dict[str, Any]]:
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
            "trigger": str(job.trigger),
        })
    return jobs


@router.post(
    "/jobs/{name}/run",
    summary="Manually trigger a background job on demand for live demo or verification",
)
async def run_job_manually(
    name: str,
    current_user: User = Depends(require_roles("admin")),
    session: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    job_map = {
        "overdue": detect_overdue_bookings,
        "stale": expire_stale_bookings_and_release_holds,
        "waitlist": expire_stale_waitlist_entries,
        "reminders": send_upcoming_booking_reminders,
        "autocomplete": autocomplete_finished_bookings_and_settle,
    }

    if name not in job_map:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown job '{name}'. Available jobs: {list(job_map.keys())}",
        )

    fn = job_map[name]
    affected = await fn(session=session) if name in ["overdue", "stale", "waitlist", "autocomplete"] else await fn()
    return {
        "job": name,
        "executed": True,
        "rows_affected": affected,
    }


@router.patch(
    "/users/{user_id}/role",
    response_model=UserRead,
    summary="Change user role (user, owner, manager, admin)",
)
async def set_user_role(
    user_id: str,
    request: Request,
    new_role: str = Body(..., embed=True),
    current_user: User = Depends(require_roles("admin")),
    session: AsyncSession = Depends(get_db),
) -> UserRead:
    ip = get_client_ip(request)
    user_repo = UserRepository(session)
    audit_repo = AuditRepository(session)

    user = await user_repo.get_by_id(user_id)
    if not user:
        raise NotFoundError("User not found", entity="User", entity_id=user_id)

    before_role = user.role
    updated = await user_repo.update(user, {"role": new_role})

    audit = AuditEvent(
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="USER_ROLE_CHANGED",
        entity_type="user",
        entity_id=user.id,
        before={"role": before_role},
        after={"role": new_role},
        reason=f"Administrator updated role to {new_role}",
        ip=ip,
    )
    await audit_repo.log_event(audit)

    return UserRead.model_validate(updated)
