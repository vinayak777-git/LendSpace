from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_client_ip, get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.incident import IncidentCreate, IncidentRead, IncidentResolve
from app.services.incident_service import IncidentService

router = APIRouter(prefix="/incidents", tags=["Incidents & Disputes"])


@router.post(
    "/",
    response_model=IncidentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Report equipment damage, delay, dispute, or safety violation",
)
async def report_incident(
    data: IncidentCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> IncidentRead:
    ip = get_client_ip(request)
    incident_service = IncidentService(session)
    incident = await incident_service.report_incident(data, reporter=current_user, ip=ip)
    return IncidentRead.model_validate(incident)


@router.get(
    "/",
    response_model=List[IncidentRead],
    summary="List reported incidents with optional filters",
)
async def list_incidents(
    resource_id: Optional[str] = Query(None),
    booking_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> List[IncidentRead]:
    incident_service = IncidentService(session)
    incidents = await incident_service.list_incidents(
        resource_id=resource_id,
        booking_id=booking_id,
        status=status,
        limit=limit,
        offset=offset,
    )
    return [IncidentRead.model_validate(i) for i in incidents]


@router.get(
    "/{incident_id}",
    response_model=IncidentRead,
    summary="Get incident details",
)
async def get_incident(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> IncidentRead:
    incident_service = IncidentService(session)
    incident = await incident_service.get_incident(incident_id)
    return IncidentRead.model_validate(incident)


@router.post(
    "/{incident_id}/resolve",
    response_model=IncidentRead,
    summary="Adjudicate and resolve an incident (staff/admin)",
)
async def resolve_incident(
    incident_id: str,
    resolution: IncidentResolve,
    request: Request,
    current_user: User = Depends(require_roles("manager", "owner", "admin")),
    session: AsyncSession = Depends(get_db),
) -> IncidentRead:
    ip = get_client_ip(request)
    incident_service = IncidentService(session)
    updated = await incident_service.resolve_incident(
        incident_id=incident_id,
        data=resolution,
        resolver=current_user,
        ip=ip,
    )
    return IncidentRead.model_validate(updated)
