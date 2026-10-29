from typing import Callable, List, Optional
import jwt
from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.errors import AuthenticationError, PermissionDeniedError
from app.core.security import decode_token
from app.db.session import booker_session_maker, get_db, owner_session_maker
from app.models.user import User
from app.repositories.user_repo import UserRepository

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False,
)


def get_client_ip(request: Request) -> str:
    """Extract client IP address from proxy headers or socket."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_db),
) -> User:
    """Authenticate JWT Bearer token and return active user."""
    if not token:
        raise AuthenticationError("Authentication token is required.")

    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token has expired.")
    except jwt.InvalidTokenError:
        raise AuthenticationError("Invalid authentication token.")

    token_type = payload.get("type")
    if token_type != "access":
        raise AuthenticationError("Invalid token type: access token required.")

    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Subject missing from token claims.")

    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_id)
    if not user:
        alt_maker = owner_session_maker if payload.get("role") != "owner" else booker_session_maker
        async with alt_maker() as alt_session:
            alt_repo = UserRepository(alt_session)
            user = await alt_repo.get_by_id(user_id)

    if not user or user.is_deleted:
        raise AuthenticationError("User account no longer exists.")

    if user.status == "suspended":
        raise PermissionDeniedError("Account has been suspended.")

    return user


async def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Return user if authenticated; otherwise None without raising."""
    if not token:
        return None
    try:
        return await get_current_user(token=token, session=session)
    except Exception:
        return None


def require_roles(*allowed_roles: str) -> Callable:
    """Role-Based Access Control (RBAC) dependency factory."""

    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role == "admin":
            return current_user  # Admin has universal override
        if current_user.role not in allowed_roles:
            raise PermissionDeniedError(
                f"Operation requires one of roles: {list(allowed_roles)}. Your role is '{current_user.role}'."
            )
        return current_user

    return role_checker
