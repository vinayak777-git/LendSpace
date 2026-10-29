from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    business_name: Optional[str] = None
    role: str
    status: str = "active"
    email_verified: bool = False


class UserCreate(UserBase):
    password: str
    org_id: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    business_name: Optional[str] = None
    privacy_settings: Optional[Dict[str, Any]] = None
    status: Optional[str] = None


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    org_id: Optional[str] = None
    privacy_settings: Dict[str, Any] = {}
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
