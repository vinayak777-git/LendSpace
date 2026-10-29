from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import DateTime, ForeignKey, Index, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDMixin


class ConditionReport(Base, UUIDMixin, TimestampMixin):
    """Before/after condition inspection checklist and photographic evidence."""

    __tablename__ = "condition_reports"

    booking_id: Mapped[str] = mapped_column(ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    phase: Mapped[str] = mapped_column(String(20), nullable=False)  # before, after
    checklist: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    photo_paths: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    recorded_by: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="condition_reports")
    recorder: Mapped["User"] = relationship("User")

    __table_args__ = (
        Index("ix_condition_reports_booking_phase", "booking_id", "phase"),
    )
