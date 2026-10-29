from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class IncidentCreate(BaseModel):
    booking_id: Optional[str] = None
    resource_id: str
    type: str  # damage, delay, dispute, safety
    severity: str = "medium"  # low, medium, high, critical
    description: str


class IncidentResolve(BaseModel):
    resolution: str  # dismissed, warning, deposit_deduction, access_suspension
    resolution_reason: str
    summary: Optional[str] = None


class IncidentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    booking_id: Optional[str] = None
    resource_id: str
    reported_by: str
    type: str
    severity: str
    description: str
    status: str
    resolution: Optional[str] = None
    resolution_reason: Optional[str] = None
    resolved_by: Optional[str] = None
    summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
