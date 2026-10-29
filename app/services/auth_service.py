import time
from collections import defaultdict
from datetime import datetime, timezone
from typing import Dict, List, Optional
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.errors import AuthenticationError, ConflictError, PermissionDeniedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.session import (
    booker_session_maker,
    get_session_maker_for_role,
    owner_session_maker,
)
from app.models.audit import AuditEvent
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.repositories.user_repo import UserRepository
from app.schemas.auth import LoginRequest, LogoutResponse, RefreshTokenRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserRead

# In-memory rate limiting for login attempts: 5 failures per 5 minutes per key
_FAILED_ATTEMPTS: Dict[str, List[float]] = defaultdict(list)
_RATE_LIMIT_WINDOW_SECONDS = 300
_RATE_LIMIT_MAX_ATTEMPTS = 5


def _check_rate_limit(key: str) -> None:
    now = time.time()
    cutoff = now - _RATE_LIMIT_WINDOW_SECONDS
    _FAILED_ATTEMPTS[key] = [t for t in _FAILED_ATTEMPTS[key] if t > cutoff]
    if len(_FAILED_ATTEMPTS[key]) >= _RATE_LIMIT_MAX_ATTEMPTS:
        raise PermissionDeniedError("Too many failed authentication attempts. Please try again in 5 minutes.")


def _record_failed_attempt(key: str) -> None:
    _FAILED_ATTEMPTS[key].append(time.time())


def _clear_rate_limit(key: str) -> None:
    _FAILED_ATTEMPTS.pop(key, None)


def _is_test_session(session: Optional[AsyncSession]) -> bool:
    if session is None or session.bind is None:
        return False
    url_str = str(session.bind.url)
    return ":memory:" in url_str or "test" in url_str or url_str.startswith("sqlite")


class AuthService:
    def __init__(self, session: Optional[AsyncSession] = None) -> None:
        self.session = session

    async def register(
        self, req: RegisterRequest, ip: Optional[str] = None
    ) -> TokenResponse:
        assigned_role = "owner" if req.role == "owner" else "booker"

        # In-memory test environment uses the test fixture session
        if _is_test_session(self.session) and self.session is not None:
            user_repo = UserRepository(self.session)
            audit_repo = AuditRepository(self.session)

            existing = await user_repo.get_by_email(req.email)
            if existing:
                raise ConflictError("An account with this email address already exists.")

            user = User(
                email=req.email.lower().strip(),
                password_hash=hash_password(req.password),
                full_name=req.full_name.strip(),
                phone=req.phone.strip() if req.phone else None,
                business_name=req.business_name.strip() if req.business_name else None,
                role=assigned_role,
                org_id=req.org_id,
                status="active",
                email_verified=False,
                privacy_settings={
                    "profile_visibility": "members",
                    "show_activity": True,
                    "allow_notifications": True,
                },
            )
            created_user = await user_repo.create(user)

            audit = AuditEvent(
                actor_id=created_user.id,
                actor_role=created_user.role,
                action="USER_REGISTERED",
                entity_type="user",
                entity_id=created_user.id,
                reason=f"User registered with role {created_user.role}",
                ip=ip,
                after={"email": created_user.email, "role": created_user.role},
            )
            await audit_repo.log_event(audit)

            access_token = create_access_token(
                subject=created_user.id,
                role=created_user.role,
                org_id=created_user.org_id,
            )
            refresh_token = create_refresh_token(subject=created_user.id, role=created_user.role)

            return TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                user=UserRead.model_validate(created_user),
            )

        # Multi-database production environment: route to dedicated isolated database
        maker = get_session_maker_for_role(assigned_role)
        async with maker() as session:
            user_repo = UserRepository(session)
            audit_repo = AuditRepository(session)

            existing = await user_repo.get_by_email(req.email)
            if existing:
                raise ConflictError("An account with this email address already exists.")

            user = User(
                email=req.email.lower().strip(),
                password_hash=hash_password(req.password),
                full_name=req.full_name.strip(),
                phone=req.phone.strip() if req.phone else None,
                business_name=req.business_name.strip() if req.business_name else None,
                role=assigned_role,
                org_id=req.org_id,
                status="active",
                email_verified=False,
                privacy_settings={
                    "profile_visibility": "members",
                    "show_activity": True,
                    "allow_notifications": True,
                },
            )
            created_user = await user_repo.create(user)

            audit = AuditEvent(
                actor_id=created_user.id,
                actor_role=created_user.role,
                action="USER_REGISTERED",
                entity_type="user",
                entity_id=created_user.id,
                reason=f"User registered with role {created_user.role}",
                ip=ip,
                after={"email": created_user.email, "role": created_user.role},
            )
            await audit_repo.log_event(audit)
            await session.commit()

            access_token = create_access_token(
                subject=created_user.id,
                role=created_user.role,
                org_id=created_user.org_id,
            )
            refresh_token = create_refresh_token(subject=created_user.id, role=created_user.role)

            return TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                user=UserRead.model_validate(created_user),
            )

    async def login(
        self, req: LoginRequest, ip: Optional[str] = None
    ) -> TokenResponse:
        rate_limit_key = f"{ip or 'unknown'}:{req.email.lower().strip()}"
        _check_rate_limit(rate_limit_key)

        # Test environment handling
        if _is_test_session(self.session) and self.session is not None:
            user_repo = UserRepository(self.session)
            user = await user_repo.get_by_email(req.email)
            if not user or not verify_password(req.password, user.password_hash):
                _record_failed_attempt(rate_limit_key)
                raise AuthenticationError("Invalid email or password.")

            if user.is_deleted:
                raise AuthenticationError("This account has been deleted.")

            if user.status == "suspended":
                raise PermissionDeniedError("Your account has been suspended.")

            _clear_rate_limit(rate_limit_key)
            user.last_login = datetime.now(timezone.utc)
            await user_repo.update(user, {"last_login": user.last_login})

            audit = AuditEvent(
                actor_id=user.id,
                actor_role=user.role,
                action="USER_LOGIN",
                entity_type="user",
                entity_id=user.id,
                reason="User authenticated successfully",
                ip=ip,
            )
            audit_repo = AuditRepository(self.session)
            await audit_repo.log_event(audit)

            access_token = create_access_token(
                subject=user.id,
                role=user.role,
                org_id=user.org_id,
            )
            refresh_token = create_refresh_token(subject=user.id, role=user.role)

            return TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                user=UserRead.model_validate(user),
            )

        # Multi-database production environment: route to targeted isolated database
        if req.role == "owner":
            target_makers = [owner_session_maker]
        elif req.role in ("booker", "user"):
            target_makers = [booker_session_maker]
        else:
            target_makers = [booker_session_maker, owner_session_maker]

        authenticated_user = None
        authenticated_session = None

        for maker in target_makers:
            session = maker()
            user_repo = UserRepository(session)
            found = await user_repo.get_by_email(req.email)
            if found and verify_password(req.password, found.password_hash):
                authenticated_user = found
                authenticated_session = session
                break
            await session.close()

        if not authenticated_user or not authenticated_session:
            _record_failed_attempt(rate_limit_key)
            raise AuthenticationError("Invalid email or password.")

        try:
            if authenticated_user.is_deleted:
                raise AuthenticationError("This account has been deleted.")

            if authenticated_user.status == "suspended":
                raise PermissionDeniedError("Your account has been suspended.")

            _clear_rate_limit(rate_limit_key)
            authenticated_user.last_login = datetime.now(timezone.utc)
            user_repo = UserRepository(authenticated_session)
            audit_repo = AuditRepository(authenticated_session)
            await user_repo.update(authenticated_user, {"last_login": authenticated_user.last_login})

            audit = AuditEvent(
                actor_id=authenticated_user.id,
                actor_role=authenticated_user.role,
                action="USER_LOGIN",
                entity_type="user",
                entity_id=authenticated_user.id,
                reason="User authenticated successfully",
                ip=ip,
            )
            await audit_repo.log_event(audit)
            await authenticated_session.commit()

            access_token = create_access_token(
                subject=authenticated_user.id,
                role=authenticated_user.role,
                org_id=authenticated_user.org_id,
            )
            refresh_token = create_refresh_token(subject=authenticated_user.id, role=authenticated_user.role)

            return TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                user=UserRead.model_validate(authenticated_user),
            )
        finally:
            await authenticated_session.close()

    async def logout(self, user: User, ip: Optional[str] = None) -> LogoutResponse:
        if _is_test_session(self.session) and self.session is not None:
            audit_repo = AuditRepository(self.session)
            audit = AuditEvent(
                actor_id=user.id,
                actor_role=user.role,
                action="USER_LOGOUT",
                entity_type="user",
                entity_id=user.id,
                reason="User logged out",
                ip=ip,
            )
            await audit_repo.log_event(audit)
            return LogoutResponse()

        maker = get_session_maker_for_role(user.role)
        async with maker() as session:
            audit_repo = AuditRepository(session)
            audit = AuditEvent(
                actor_id=user.id,
                actor_role=user.role,
                action="USER_LOGOUT",
                entity_type="user",
                entity_id=user.id,
                reason="User logged out",
                ip=ip,
            )
            await audit_repo.log_event(audit)
            await session.commit()
        return LogoutResponse()

    async def refresh_tokens(self, req: RefreshTokenRequest) -> TokenResponse:
        try:
            payload = decode_token(req.refresh_token)
        except jwt.ExpiredSignatureError:
            raise AuthenticationError("Refresh token has expired. Please log in again.")
        except jwt.InvalidTokenError:
            raise AuthenticationError("Invalid refresh token.")

        if payload.get("type") != "refresh":
            raise AuthenticationError("Invalid token type: refresh token required.")

        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Malformed token subject.")

        if _is_test_session(self.session) and self.session is not None:
            user_repo = UserRepository(self.session)
            user = await user_repo.get_by_id(user_id)
            if not user or user.is_deleted:
                raise AuthenticationError("User account no longer exists.")

            if user.status == "suspended":
                raise PermissionDeniedError("Your account has been suspended.")

            new_access_token = create_access_token(
                subject=user.id,
                role=user.role,
                org_id=user.org_id,
            )
            new_refresh_token = create_refresh_token(subject=user.id, role=user.role)

            return TokenResponse(
                access_token=new_access_token,
                refresh_token=new_refresh_token,
                user=UserRead.model_validate(user),
            )

        role = payload.get("role")
        maker = get_session_maker_for_role(role)
        async with maker() as session:
            user_repo = UserRepository(session)
            user = await user_repo.get_by_id(user_id)
            if not user or user.is_deleted:
                raise AuthenticationError("User account no longer exists.")

            if user.status == "suspended":
                raise PermissionDeniedError("Your account has been suspended.")

            new_access_token = create_access_token(
                subject=user.id,
                role=user.role,
                org_id=user.org_id,
            )
            new_refresh_token = create_refresh_token(subject=user.id, role=user.role)

            return TokenResponse(
                access_token=new_access_token,
                refresh_token=new_refresh_token,
                user=UserRead.model_validate(user),
            )
