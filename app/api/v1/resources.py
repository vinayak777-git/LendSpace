from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_client_ip, get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.resource import (
    BlackoutDateSchema,
    ResourceCreate,
    ResourceDetailRead,
    ResourceRead,
    ResourceUpdate,
)
from app.services.resource_service import ResourceService

router = APIRouter(prefix="/resources", tags=["Resources"])


@router.get(
    "/",
    response_model=List[ResourceRead],
    summary="Search sharable spaces and equipment",
)
async def list_resources(
    query: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    kind: Optional[str] = Query(None),
    status: Optional[str] = Query("live"),
    owner_id: Optional[str] = Query(None),
    min_capacity: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db),
) -> List[ResourceRead]:
    resource_service = ResourceService(session)
    resources = await resource_service.list_resources(
        query=query,
        category=category,
        kind=kind,
        status=status,
        owner_id=owner_id,
        min_capacity=min_capacity,
        limit=limit,
        offset=offset,
    )
    return [ResourceRead.model_validate(r) for r in resources]


@router.post(
    "/",
    response_model=ResourceDetailRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new resource listing (owner/admin)",
)
async def create_resource(
    data: ResourceCreate,
    request: Request,
    current_user: User = Depends(require_roles("owner", "admin")),
    session: AsyncSession = Depends(get_db),
) -> ResourceDetailRead:
    ip = get_client_ip(request)
    resource_service = ResourceService(session)
    created = await resource_service.create_resource(data, owner=current_user, ip=ip)
    # Reload with relationships
    detailed = await resource_service.get_resource_details(created.id)
    return ResourceDetailRead.model_validate(detailed)


@router.get(
    "/{resource_id}",
    response_model=ResourceDetailRead,
    summary="Get full resource details including rules and requirements",
)
async def get_resource(
    resource_id: str,
    session: AsyncSession = Depends(get_db),
) -> ResourceDetailRead:
    resource_service = ResourceService(session)
    resource = await resource_service.get_resource_details(resource_id)
    return ResourceDetailRead.model_validate(resource)


@router.patch(
    "/{resource_id}",
    response_model=ResourceDetailRead,
    summary="Update resource rules, availability, or settings",
)
async def update_resource(
    resource_id: str,
    data: ResourceUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ResourceDetailRead:
    ip = get_client_ip(request)
    resource_service = ResourceService(session)
    await resource_service.update_resource(resource_id, data, actor=current_user, ip=ip)
    detailed = await resource_service.get_resource_details(resource_id)
    return ResourceDetailRead.model_validate(detailed)


@router.delete(
    "/{resource_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete a resource listing",
)
async def delete_resource(
    resource_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    ip = get_client_ip(request)
    resource_service = ResourceService(session)
    await resource_service.delete_resource(resource_id, actor=current_user, ip=ip)


@router.post(
    "/{resource_id}/blackout",
    response_model=ResourceDetailRead,
    summary="Schedule maintenance or facility blackout window",
)
async def add_blackout(
    resource_id: str,
    blackout: BlackoutDateSchema,
    request: Request,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ResourceDetailRead:
    ip = get_client_ip(request)
    resource_service = ResourceService(session)
    updated = await resource_service.add_blackout(
        resource_id=resource_id,
        blackout=blackout,
        actor=current_user,
        ip=ip,
    )
    return ResourceDetailRead.model_validate(updated)
