from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class TeamMemberInvite(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "manager"  # manager, staff
    can_approve: bool = True
    can_confirm_returns: bool = True
    can_handle_incidents: bool = True


class TeamMemberUpdate(BaseModel):
    can_approve: Optional[bool] = None
    can_confirm_returns: Optional[bool] = None
    can_handle_incidents: Optional[bool] = None


class TeamMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    resource_id: str
    can_approve: bool
    can_confirm_returns: bool
    can_handle_incidents: bool
