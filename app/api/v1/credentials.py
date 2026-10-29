from typing import List
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_client_ip, get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.credential import CredentialCreate, CredentialRead, CredentialReview
from app.services.credential_service import CredentialService

router = APIRouter(prefix="/credentials", tags=["Credentials"])


@router.post(
    "/",
    response_model=CredentialRead,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a safety training or qualification credential",
)
async def submit_credential(
    data: CredentialCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> CredentialRead:
    ip = get_client_ip(request)
    credential_service = CredentialService(session)
    cred = await credential_service.submit_credential(
        user_id=current_user.id, data=data, actor=current_user, ip=ip
    )
    return CredentialRead.model_validate(cred)


@router.get(
    "/me",
    response_model=List[CredentialRead],
    summary="List all credentials belonging to the current user",
)
async def list_my_credentials(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> List[CredentialRead]:
    credential_service = CredentialService(session)
    creds = await credential_service.list_for_user(current_user.id)
    return [CredentialRead.model_validate(c) for c in creds]


@router.get(
    "/pending",
    response_model=List[CredentialRead],
    summary="List pending credentials awaiting verification (staff/admin)",
)
async def list_pending_credentials(
    current_user: User = Depends(require_roles("manager", "owner", "admin")),
    session: AsyncSession = Depends(get_db),
) -> List[CredentialRead]:
    credential_service = CredentialService(session)
    creds = await credential_service.list_pending()
    return [CredentialRead.model_validate(c) for c in creds]


@router.post(
    "/{credential_id}/review",
    response_model=CredentialRead,
    summary="Approve or reject a submitted user credential",
)
async def review_credential(
    credential_id: str,
    review: CredentialReview,
    request: Request,
    current_user: User = Depends(require_roles("manager", "owner", "admin")),
    session: AsyncSession = Depends(get_db),
) -> CredentialRead:
    ip = get_client_ip(request)
    credential_service = CredentialService(session)
    updated = await credential_service.review_credential(
        credential_id=credential_id,
        review=review,
        reviewer=current_user,
        ip=ip,
    )
    return CredentialRead.model_validate(updated)
