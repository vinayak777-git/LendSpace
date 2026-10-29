from datetime import datetime, timezone
import uuid
from typing import Any, Dict, Optional
from sqlalchemy import DateTime, Index, JSON, String, Text, event, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class AuditEvent(Base):
    """Immutable regulatory compliance log (APPEND-ONLY)."""

    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    actor_role: Mapped[str] = mapped_column(String(50), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    booking_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    before: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    after: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    ip: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_audit_events_entity_created", "entity_type", "entity_id", "created_at"),
    )


# Append-only ORM guard: block any UPDATE or DELETE operations on AuditEvent
@event.listens_for(AuditEvent, "before_update")
def block_audit_update(mapper, connection, target):
    raise RuntimeError("AuditEvent is append-only. Modification of audit logs is strictly prohibited.")


@event.listens_for(AuditEvent, "before_delete")
def block_audit_delete(mapper, connection, target):
    raise RuntimeError("AuditEvent is append-only. Deletion of audit logs is strictly prohibited.")
