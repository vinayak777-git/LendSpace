from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, model_validator


class BookingCreate(BaseModel):
    resource_id: str
    start_at: datetime
    end_at: datetime
    purpose: str
    is_academic: bool = False

    @model_validator(mode="after")
    def validate_times(self) -> "BookingCreate":
        if self.end_at <= self.start_at:
            raise ValueError("End time must be strictly after start time.")
        return self


class BookingAction(BaseModel):
    reason: Optional[str] = "Standard administrative action"


class BookingUserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    business_name: Optional[str] = None
    is_verified_by_platform: bool = False
    completed_bookings_count: int = 0
    average_rating: float = 0.0


class BookingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    resource_id: str
    user_id: str
    user: Optional[BookingUserRead] = None
    start_at: datetime
    end_at: datetime
    purpose: str
    status: str
    decision_by: Optional[str] = None
    decision_reason: Optional[str] = None
    priority_score: int = 50
    score_breakdown: Dict[str, Any] = {}
    checked_in_at: Optional[datetime] = None
    returned_at: Optional[datetime] = None
    cancelled_reason: Optional[str] = None
    parent_booking_id: Optional[str] = None
    total_price_minor_units: int = 0
    deposit_minor_units: int = 0
    payment_status: str = "none"
    created_at: datetime
    updated_at: datetime


class ConflictCheckRequest(BaseModel):
    resource_id: str
    start_at: datetime
    end_at: datetime
    exclude_booking_id: Optional[str] = None


class ConflictCheckResponse(BaseModel):
    has_conflict: bool
    reasons: List[str]
    suggested_slots: List[Dict[str, str]]


class EligibilityCheckResponse(BaseModel):
    eligible: bool
    checks: List[Dict[str, Any]]
