from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_client_ip, get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.booking import (
    BookingAction,
    BookingCreate,
    BookingRead,
    ConflictCheckRequest,
    ConflictCheckResponse,
    EligibilityCheckResponse,
)
from app.services.booking_service import BookingService

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post(
    "/",
    response_model=BookingRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a resource reservation with eligibility, conflict & fairness checks",
)
async def create_booking(
    data: BookingCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> BookingRead:
    ip = get_client_ip(request)
    booking_service = BookingService(session)
    booking = await booking_service.create_booking(data, user=current_user, ip=ip)
    return BookingRead.model_validate(booking)


@router.get(
    "/me",
    response_model=List[BookingRead],
    summary="List all reservations for the authenticated user",
)
async def list_my_bookings(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> List[BookingRead]:
    booking_service = BookingService(session)
    bookings = await booking_service.list_user_bookings(
        user_id=current_user.id, status=status, limit=limit, offset=offset
    )
    return [BookingRead.model_validate(b) for b in bookings]


@router.get(
    "/owner",
    response_model=List[BookingRead],
    summary="List all reservation requests for resources owned by the authenticated owner",
)
async def list_owner_bookings(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_roles("owner", "manager", "admin")),
    session: AsyncSession = Depends(get_db),
) -> List[BookingRead]:
    booking_service = BookingService(session)
    bookings = await booking_service.list_owner_bookings(
        owner_id=current_user.id, status=status, limit=limit, offset=offset
    )
    return [BookingRead.model_validate(b) for b in bookings]


@router.get(
    "/resource/{resource_id}",
    response_model=List[BookingRead],
    summary="List reservations for a specific resource",
)
async def list_resource_bookings(
    resource_id: str,
    start_after: Optional[datetime] = Query(None),
    end_before: Optional[datetime] = Query(None),
    session: AsyncSession = Depends(get_db),
) -> List[BookingRead]:
    booking_service = BookingService(session)
    bookings = await booking_service.list_resource_bookings(
        resource_id=resource_id, start_after=start_after, end_before=end_before
    )
    return [BookingRead.model_validate(b) for b in bookings]


@router.get(
    "/{booking_id}",
    response_model=BookingRead,
    summary="Get booking details",
)
async def get_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> BookingRead:
    booking_service = BookingService(session)
    booking = await booking_service.get_booking_details(booking_id)
    return BookingRead.model_validate(booking)


@router.post(
    "/{booking_id}/action",
    response_model=BookingRead,
    summary="Execute a booking state machine lifecycle transition",
)
async def transition_booking(
    booking_id: str,
    action: BookingAction,
    target_status: str = Query(..., description="Target status: approved, rejected, cancelled, checked_in, returned, no_show, closed"),
    request: Request = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> BookingRead:
    ip = get_client_ip(request) if request else None
    booking_service = BookingService(session)
    updated = await booking_service.transition_booking(
        booking_id=booking_id,
        target_status=target_status,
        action=action,
        actor=current_user,
        ip=ip,
    )
    return BookingRead.model_validate(updated)


@router.post(
    "/check-conflicts",
    response_model=ConflictCheckResponse,
    summary="Pre-validate booking time window and receive alternative slots",
)
async def check_conflicts_endpoint(
    req: ConflictCheckRequest,
    session: AsyncSession = Depends(get_db),
) -> ConflictCheckResponse:
    booking_service = BookingService(session)
    result = await booking_service.check_booking_conflicts(
        resource_id=req.resource_id,
        start_at=req.start_at,
        end_at=req.end_at,
        exclude_booking_id=req.exclude_booking_id,
    )
    return ConflictCheckResponse(
        has_conflict=result["has_conflict"],
        reasons=result["reasons"],
        suggested_slots=result["suggested_slots"],
    )


@router.get(
    "/check-eligibility/{resource_id}",
    response_model=EligibilityCheckResponse,
    summary="Pre-validate authenticated user eligibility for a resource",
)
async def check_eligibility_endpoint(
    resource_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> EligibilityCheckResponse:
    booking_service = BookingService(session)
    result = await booking_service.check_user_eligibility(
        resource_id=resource_id, user=current_user
    )
    return EligibilityCheckResponse(
        eligible=result["eligible"],
        checks=result["checks"],
    )
