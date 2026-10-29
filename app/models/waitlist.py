from datetime import datetime
from typing import Any, Dict
from sqlalchemy import DateTime, ForeignKey, Index, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDMixin


class WaitlistEntry(Base, UUIDMixin, TimestampMixin):
    """Queued reservation request when desired slot is contested or unavailable."""

    __tablename__ = "waitlist_entries"

    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    desired_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    desired_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    priority_score: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    score_breakdown: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50),
        default="waiting",
        nullable=False,
        index=True,
    )  # waiting, promoted, expired, cancelled

    resource: Mapped["Resource"] = relationship("Resource")
    user: Mapped["User"] = relationship("User")

    __table_args__ = (
        Index("ix_waitlist_resource_status", "resource_id", "status"),
    )
