from typing import List
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_client_ip, get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.team import TeamMemberInvite, TeamMemberRead
from app.services.team_service import TeamService

router = APIRouter(prefix="/teams", tags=["Teams & Resource Managers"])


@router.post(
    "/{resource_id}/invite",
    response_model=TeamMemberRead,
    status_code=status.HTTP_201_CREATED,
    summary="Assign or invite a manager to assist with resource approvals",
)
async def invite_team_member(
    resource_id: str,
    data: TeamMemberInvite,
    request: Request,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> TeamMemberRead:
    ip = get_client_ip(request)
    team_service = TeamService(session)
    mgr = await team_service.invite_or_add_member(
        resource_id=resource_id, data=data, actor=current_user, ip=ip
    )
    return TeamMemberRead.model_validate(mgr)


@router.get(
    "/{resource_id}/members",
    response_model=List[TeamMemberRead],
    summary="List delegated managers for a resource",
)
async def list_team_members(
    resource_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> List[TeamMemberRead]:
    team_service = TeamService(session)
    members = await team_service.list_members(resource_id)
    return [TeamMemberRead.model_validate(m) for m in members]


@router.delete(
    "/{resource_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a manager's delegation on a resource",
)
async def remove_team_member(
    resource_id: str,
    user_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    ip = get_client_ip(request)
    team_service = TeamService(session)
    await team_service.remove_member(
        resource_id=resource_id, user_id=user_id, actor=current_user, ip=ip
    )
