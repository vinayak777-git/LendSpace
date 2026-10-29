from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.analytics import TelemetryResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics & Telemetry"])


@router.get(
    "/telemetry",
    response_model=TelemetryResponse,
    summary="Get operational telemetry, utilization rates, and booking statistics",
)
async def get_telemetry(
    current_user: User = Depends(require_roles("manager", "owner", "admin")),
    session: AsyncSession = Depends(get_db),
) -> TelemetryResponse:
    analytics_service = AnalyticsService(session)
    return await analytics_service.get_telemetry()
