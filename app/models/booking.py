from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import DateTime, ForeignKey, Index, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDMixin


class Booking(Base, UUIDMixin, TimestampMixin):
    """Reservation slot for a resource with state machine lifecycle."""

    __tablename__ = "bookings"

    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    purpose: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False,
        index=True,
    )  # pending, approved, rejected, waitlisted, checked_in, returned, overdue, disputed, closed, cancelled, no_show

    decision_by: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    decision_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    priority_score: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    score_breakdown: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    checked_in_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    returned_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    parent_booking_id: Mapped[Optional[str]] = mapped_column(ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)

    # Built-in Financial & Escrow Tracking (Minor units, integer)
    total_price_minor_units: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    deposit_minor_units: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    payment_status: Mapped[str] = mapped_column(
        String(50), default="none", nullable=False, index=True
    )  # none, held, released, refunded

    # Relationships
    resource: Mapped["Resource"] = relationship("Resource", back_populates="bookings", lazy="selectin")
    user: Mapped["User"] = relationship("User", back_populates="bookings", foreign_keys=[user_id], lazy="selectin")
    decision_maker: Mapped[Optional["User"]] = relationship("User", foreign_keys=[decision_by])
    condition_reports: Mapped[List["ConditionReport"]] = relationship("ConditionReport", back_populates="booking", cascade="all, delete-orphan")
    incidents: Mapped[List["Incident"]] = relationship("Incident", back_populates="booking")
    review: Mapped[Optional["Review"]] = relationship("Review", back_populates="booking", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_bookings_resource_window", "resource_id", "start_at", "end_at"),
        Index("ix_bookings_resource_window_status", "resource_id", "start_at", "end_at", "status"),
        Index("ix_bookings_user_status", "user_id", "status"),
    )
