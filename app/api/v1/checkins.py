from typing import List
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_client_ip, get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.condition_report import ConditionReportCreate, ConditionReportRead
from app.services.condition_service import ConditionService

router = APIRouter(prefix="/checkins", tags=["Checkins & Inspections"])


@router.post(
    "/inspect",
    response_model=ConditionReportRead,
    status_code=status.HTTP_201_CREATED,
    summary="Record pre-pickup or post-return condition inspection checklist",
)
async def submit_inspection(
    data: ConditionReportCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ConditionReportRead:
    ip = get_client_ip(request)
    condition_service = ConditionService(session)
    report = await condition_service.submit_report(data, user=current_user, ip=ip)
    return ConditionReportRead.model_validate(report)


@router.get(
    "/{booking_id}/reports",
    response_model=List[ConditionReportRead],
    summary="List condition inspection reports for a booking",
)
async def list_booking_reports(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> List[ConditionReportRead]:
    condition_service = ConditionService(session)
    reports = await condition_service.list_by_booking(booking_id)
    return [ConditionReportRead.model_validate(r) for r in reports]
