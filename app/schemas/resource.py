from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AvailabilityWindowSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    weekday: int = Field(..., ge=0, le=6)
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")


class BlackoutDateSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    start_at: datetime
    end_at: datetime
    reason: str


class ResourceRequirementSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    type: str  # training, membership, qualification, id, faculty_approval
    name: str
    required_credential_name: Optional[str] = None


class ResourceManagerSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    can_approve: bool = True
    can_confirm_returns: bool = True
    can_handle_incidents: bool = True


class ResourceBase(BaseModel):
    title: str
    description: str
    kind: str = "equipment"  # equipment, space, device, tool, lab
    category: str
    location: str
    building: Optional[str] = None
    room: Optional[str] = None
    capacity: Optional[int] = None
    asset_tag: Optional[str] = None
    condition_notes: Optional[str] = None
    images: List[str] = []
    status: str = "live"  # draft, pending_verification, live, paused, archived
    approval_mode: str = "manual"  # auto, manual
    supervision_required: bool = False
    deposit_amount: float = Field(default=0.0, ge=0.0)
    max_hours_per_booking: int = Field(default=4, ge=1)
    max_hours_per_week_per_user: int = Field(default=12, ge=1)
    cooldown_hours: int = Field(default=0, ge=0)
    max_advance_days: int = Field(default=14, ge=1)
    buffer_minutes: int = Field(default=15, ge=0)
    allowed_audience: str = "anyone_verified"  # anyone_verified, org_only, approved_list
    waitlist_enabled: bool = True
    safety_notes: Optional[str] = None
    usage_rules: List[str] = []
    condition_checklist: List[str] = []
    hourly_rate: float = Field(default=0.0, ge=0.0)
    daily_rate: float = Field(default=0.0, ge=0.0)
    pricing_model: str = "hourly"
    currency: str = "₹"
    area_sq_ft: Optional[float] = None


class ResourceCreate(ResourceBase):
    requirements: List[ResourceRequirementSchema] = []
    availability_windows: List[AvailabilityWindowSchema] = []
    blackout_dates: List[BlackoutDateSchema] = []
    managers: List[ResourceManagerSchema] = []


class ResourceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    kind: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    building: Optional[str] = None
    room: Optional[str] = None
    capacity: Optional[int] = None
    asset_tag: Optional[str] = None
    condition_notes: Optional[str] = None
    images: Optional[List[str]] = None
    status: Optional[str] = None
    approval_mode: Optional[str] = None
    supervision_required: Optional[bool] = None
    deposit_amount: Optional[float] = None
    max_hours_per_booking: Optional[int] = None
    max_hours_per_week_per_user: Optional[int] = None
    cooldown_hours: Optional[int] = None
    max_advance_days: Optional[int] = None
    buffer_minutes: Optional[int] = None
    allowed_audience: Optional[str] = None
    waitlist_enabled: Optional[bool] = None
    safety_notes: Optional[str] = None
    usage_rules: Optional[List[str]] = None
    condition_checklist: Optional[List[str]] = None
    hourly_rate: Optional[float] = None
    daily_rate: Optional[float] = None
    pricing_model: Optional[str] = None
    currency: Optional[str] = None
    area_sq_ft: Optional[float] = None


class ResourceRead(ResourceBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    owner_id: str
    org_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ResourceDetailRead(ResourceRead):
    requirements: List[ResourceRequirementSchema] = []
    availability_windows: List[AvailabilityWindowSchema] = []
    blackout_dates: List[BlackoutDateSchema] = []
    managers: List[ResourceManagerSchema] = []
