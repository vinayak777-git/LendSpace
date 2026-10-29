from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_client_ip, get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, LogoutResponse, RefreshTokenRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserRead
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(
    req: RegisterRequest,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> TokenResponse:
    ip = get_client_ip(request)
    auth_service = AuthService(session)
    return await auth_service.register(req, ip=ip)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate and receive access + refresh tokens",
)
async def login(
    req: LoginRequest,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> TokenResponse:
    ip = get_client_ip(request)
    auth_service = AuthService(session)
    return await auth_service.login(req, ip=ip)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Rotate refresh token and get a new access token",
)
async def refresh(
    req: RefreshTokenRequest,
    session: AsyncSession = Depends(get_db),
) -> TokenResponse:
    auth_service = AuthService(session)
    return await auth_service.refresh_tokens(req)


@router.get(
    "/me",
    response_model=UserRead,
    summary="Retrieve authenticated user profile",
)
async def get_me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.post(
    "/logout",
    response_model=LogoutResponse,
    summary="Invalidate user session",
)
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> LogoutResponse:
    ip = get_client_ip(request)
    auth_service = AuthService(session)
    return await auth_service.logout(current_user, ip=ip)
