from typing import List
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_client_ip, get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.waitlist import WaitlistEntryCreate, WaitlistEntryRead
from app.services.waitlist_service import WaitlistService

router = APIRouter(prefix="/waitlist", tags=["Waitlist"])


@router.post(
    "/",
    response_model=WaitlistEntryRead,
    status_code=status.HTTP_201_CREATED,
    summary="Join resource waitlist queue with priority scoring",
)
async def join_waitlist(
    data: WaitlistEntryCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> WaitlistEntryRead:
    ip = get_client_ip(request)
    waitlist_service = WaitlistService(session)
    entry = await waitlist_service.join_waitlist(data, user=current_user, ip=ip)
    return WaitlistEntryRead.model_validate(entry)


@router.get(
    "/resource/{resource_id}",
    response_model=List[WaitlistEntryRead],
    summary="List active waitlist queue for a resource",
)
async def list_resource_waitlist(
    resource_id: str,
    session: AsyncSession = Depends(get_db),
) -> List[WaitlistEntryRead]:
    waitlist_service = WaitlistService(session)
    entries = await waitlist_service.list_for_resource(resource_id)
    return [WaitlistEntryRead.model_validate(e) for e in entries]


@router.get(
    "/me",
    response_model=List[WaitlistEntryRead],
    summary="List user's active waitlist entries",
)
async def list_my_waitlist(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> List[WaitlistEntryRead]:
    waitlist_service = WaitlistService(session)
    entries = await waitlist_service.list_for_user(current_user.id)
    return [WaitlistEntryRead.model_validate(e) for e in entries]


@router.delete(
    "/{entry_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Leave waitlist queue",
)
async def leave_waitlist(
    entry_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    ip = get_client_ip(request)
    waitlist_service = WaitlistService(session)
    await waitlist_service.leave_waitlist(entry_id, actor=current_user, ip=ip)
