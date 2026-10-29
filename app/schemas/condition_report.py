from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class ConditionReportCreate(BaseModel):
    booking_id: str
    phase: str  # before, after
    checklist: Dict[str, Any]
    notes: Optional[str] = None
    photo_paths: List[str] = []


class ConditionReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    booking_id: str
    phase: str
    checklist: Dict[str, Any]
    notes: Optional[str] = None
    photo_paths: List[str]
    recorded_by: str
    recorded_at: datetime
    created_at: datetime
