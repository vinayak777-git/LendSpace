from typing import Any, Dict, Optional, Union
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.schemas.user import UserRead


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2)
    phone: Optional[str] = None
    business_name: Optional[str] = None
    role: str = Field(default="booker")  # booker, user, owner
    org_id: Optional[str] = None
    org_name: Optional[str] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        role_clean = v.strip().lower()
        if role_clean in ("booker", "user"):
            return "booker"
        elif role_clean == "owner":
            return "owner"
        raise ValueError("Public registration is only permitted for 'booker' or 'owner' roles.")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None  # 'booker', 'user', or 'owner'


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 900  # in seconds (900 for 15m)
    user: Union[UserRead, Dict[str, Any]]


class LogoutResponse(BaseModel):
    message: str = "Logged out successfully"

