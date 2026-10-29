from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.audit import AuditEventRead
from app.services.audit_service import AuditService

router = APIRouter(prefix="/audit", tags=["Audit Log"])


@router.get(
    "/",
    response_model=List[AuditEventRead],
    summary="Query immutable regulatory audit trail (Staff/Admin only)",
)
async def list_audit_events(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[str] = Query(None),
    booking_id: Optional[str] = Query(None),
    actor_id: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_roles("manager", "owner", "admin")),
    session: AsyncSession = Depends(get_db),
) -> List[AuditEventRead]:
    audit_service = AuditService(session)
    events = await audit_service.list_events(
        entity_type=entity_type,
        entity_id=entity_id,
        booking_id=booking_id,
        actor_id=actor_id,
        limit=limit,
        offset=offset,
    )
    return [AuditEventRead.model_validate(e) for e in events]
