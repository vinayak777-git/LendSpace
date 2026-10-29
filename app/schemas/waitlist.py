from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict


class WaitlistEntryCreate(BaseModel):
    resource_id: str
    desired_start: datetime
    desired_end: datetime
    purpose: str = "Research project"
    is_academic: bool = False


class WaitlistEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    resource_id: str
    user_id: str
    desired_start: datetime
    desired_end: datetime
    position: int
    priority_score: int
    score_breakdown: Dict[str, Any]
    status: str
    created_at: datetime
    updated_at: datetime
