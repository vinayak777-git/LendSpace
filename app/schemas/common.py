from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Standard unified response wrapper."""
    model_config = ConfigDict(from_attributes=True)

    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated list response."""
    model_config = ConfigDict(from_attributes=True)

    items: List[T]
    total: int
    page: int = 1
    size: int = 50
