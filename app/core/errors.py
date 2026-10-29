import logging
from typing import Any, Dict, Optional
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class LendSpaceException(Exception):
    """Base exception for all LendSpace domain errors."""

    def __init__(
        self,
        message: str,
        code: str = "ERROR",
        status_code: int = status.HTTP_400_BAD_REQUEST,
        extra: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.extra = extra or {}


class NotFoundError(LendSpaceException):
    def __init__(self, message: str, entity: str = "Entity", entity_id: Any = None):
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            extra={"entity": entity, "entity_id": str(entity_id) if entity_id else None},
        )


class ConflictError(LendSpaceException):
    def __init__(self, message: str, extra: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=status.HTTP_409_CONFLICT,
            extra=extra or {},
        )


class InvalidStateTransitionError(LendSpaceException):
    def __init__(self, from_state: str, to_state: str, reason: str = ""):
        super().__init__(
            message=f"Illegal transition from '{from_state}' to '{to_state}'. {reason}".strip(),
            code="INVALID_STATE_TRANSITION",
            status_code=status.HTTP_409_CONFLICT,
            extra={"from_state": from_state, "to_state": to_state},
        )


class PermissionDeniedError(LendSpaceException):
    def __init__(self, message: str = "Permission denied for this operation."):
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=status.HTTP_403_FORBIDDEN,
        )


class AuthenticationError(LendSpaceException):
    def __init__(self, message: str = "Could not validate credentials."):
        super().__init__(
            message=message,
            code="UNAUTHORIZED",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class EligibilityError(LendSpaceException):
    def __init__(self, message: str, checks: Optional[list] = None):
        super().__init__(
            message=message,
            code="INELIGIBLE",
            status_code=status.HTTP_400_BAD_REQUEST,
            extra={"checks": checks or []},
        )


def register_error_handlers(app: FastAPI) -> None:
    """Attach standard exception handlers to the FastAPI app."""

    @app.exception_handler(LendSpaceException)
    async def lendspace_exception_handler(request: Request, exc: LendSpaceException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.message,
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "extra": exc.extra,
                },
            },
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled system error: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An internal server error occurred.",
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An internal server error occurred.",
                },
            },
        )
