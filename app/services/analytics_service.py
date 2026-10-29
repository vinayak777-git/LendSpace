from datetime import datetime, timezone
from typing import Any, Dict, List
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.booking import Booking
from app.models.incident import Incident
from app.models.resource import Resource
from app.schemas.analytics import TelemetryResponse, UtilizationStat


class AnalyticsService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_telemetry(self) -> TelemetryResponse:
        # Total bookings
        total_bookings_res = await self.session.execute(
            select(func.count(Booking.id))
        )
        total_bookings = int(total_bookings_res.scalar_one() or 0)

        # Active now (checked_in)
        active_res = await self.session.execute(
            select(func.count(Booking.id)).where(Booking.status == "checked_in")
        )
        active_now = int(active_res.scalar_one() or 0)

        # Overdue
        overdue_res = await self.session.execute(
            select(func.count(Booking.id)).where(Booking.status == "overdue")
        )
        overdue_count = int(overdue_res.scalar_one() or 0)

        # Open incidents
        incidents_res = await self.session.execute(
            select(func.count(Incident.id)).where(Incident.status.in_(["open", "under_review"]))
        )
        open_incidents = int(incidents_res.scalar_one() or 0)

        # Resource utilization
        resources_res = await self.session.execute(
            select(Resource).where(Resource.is_deleted.is_(False)).limit(10)
        )
        resources = list(resources_res.scalars().all())

        utilization_stats: List[UtilizationStat] = []
        for r in resources:
            bookings_res = await self.session.execute(
                select(Booking).where(
                    Booking.resource_id == r.id,
                    Booking.status.in_(["approved", "checked_in", "returned", "closed"]),
                )
            )
            bookings = list(bookings_res.scalars().all())
            total_hours = sum(
                (b.end_at - b.start_at).total_seconds() / 3600.0 for b in bookings
            )
            # Benchmark 80 hours operational weekly standard
            utilization_rate = round(min(1.0, total_hours / 80.0) * 100, 1)

            utilization_stats.append(
                UtilizationStat(
                    resource_id=r.id,
                    resource_title=r.title,
                    total_hours=round(total_hours, 1),
                    utilization_rate=utilization_rate,
                )
            )

        # Peak hours distribution dummy template
        hourly_distribution: List[Dict[str, Any]] = [
            {"hour": f"{h:02d}:00", "count": 1 + (h % 5)} for h in range(8, 21)
        ]

        return TelemetryResponse(
            total_bookings=total_bookings,
            active_now=active_now,
            overdue_count=overdue_count,
            open_incidents=open_incidents,
            utilization=utilization_stats,
            hourly_distribution=hourly_distribution,
        )
