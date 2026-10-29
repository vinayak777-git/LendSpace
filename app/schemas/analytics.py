from typing import Any, Dict, List
from pydantic import BaseModel


class UtilizationStat(BaseModel):
    resource_id: str
    resource_title: str
    total_hours: float
    utilization_rate: float


class TelemetryResponse(BaseModel):
    total_bookings: int
    active_now: int
    overdue_count: int
    open_incidents: int
    utilization: List[UtilizationStat]
    hourly_distribution: List[Dict[str, Any]]
