from typing import List, Optional
from fastapi import APIRouter, Body, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_client_ip, get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/",
    response_model=List[UserRead],
    summary="List active users (manager/admin)",
)
async def list_users(
    role: Optional[str] = Query(None),
    org_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_roles("manager", "owner", "admin")),
    session: AsyncSession = Depends(get_db),
) -> List[UserRead]:
    user_service = UserService(session)
    users = await user_service.list_users(role=role, org_id=org_id, limit=limit, offset=offset)
    return [UserRead.model_validate(u) for u in users]


@router.get(
    "/me",
    response_model=UserRead,
    summary="Get current user profile",
)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
) -> UserRead:
    return UserRead.model_validate(current_user)


@router.get(
    "/{user_id}",
    response_model=UserRead,
    summary="Get user profile by ID",
)
async def get_user_by_id(
    user_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> UserRead:
    user_service = UserService(session)
    user = await user_service.get_user(user_id)
    return UserRead.model_validate(user)


@router.patch(
    "/me",
    response_model=UserRead,
    summary="Update current user's profile and privacy preferences",
)
async def update_my_profile(
    update_data: UserUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> UserRead:
    ip = get_client_ip(request)
    user_service = UserService(session)
    updated = await user_service.update_profile(
        user_id=current_user.id,
        update_data=update_data,
        actor=current_user,
        ip=ip,
    )
    return UserRead.model_validate(updated)


@router.patch(
    "/{user_id}/status",
    response_model=UserRead,
    summary="Change account standing (admin only: active/suspended)",
)
async def update_user_status(
    user_id: str,
    request: Request,
    status: str = Body(..., embed=True),
    reason: str = Body("Administrative action", embed=True),
    current_user: User = Depends(require_roles("admin")),
    session: AsyncSession = Depends(get_db),
) -> UserRead:
    ip = get_client_ip(request)
    user_service = UserService(session)
    updated = await user_service.update_status(
        user_id=user_id,
        status=status,
        actor=current_user,
        reason=reason,
        ip=ip,
    )
    return UserRead.model_validate(updated)
