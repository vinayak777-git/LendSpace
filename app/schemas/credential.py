from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CredentialBase(BaseModel):
    type: str  # training, membership, qualification, id
    name: str
    expiry_date: Optional[datetime] = None


class CredentialCreate(CredentialBase):
    pass


class CredentialReview(BaseModel):
    status: str  # verified, rejected
    review_reason: Optional[str] = None


class CredentialRead(CredentialBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    status: str
    document_path: Optional[str] = None
    reviewed_by: Optional[str] = None
    review_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
