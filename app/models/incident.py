from typing import Optional
from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDMixin


class Incident(Base, UUIDMixin, TimestampMixin):
    """Equipment damage, return delay, dispute, or safety violation record."""

    __tablename__ = "incidents"

    booking_id: Mapped[Optional[str]] = mapped_column(ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    reported_by: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # damage, delay, dispute, safety
    severity: Mapped[str] = mapped_column(String(50), default="medium", nullable=False)  # low, medium, high, critical
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50),
        default="open",
        nullable=False,
        index=True,
    )  # open, under_review, resolved, dismissed
    resolution: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # dismissed, warning, deposit_deduction, access_suspension
    resolution_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_by: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    booking: Mapped[Optional["Booking"]] = relationship("Booking", back_populates="incidents")
    resource: Mapped["Resource"] = relationship("Resource")
    reporter: Mapped["User"] = relationship("User", foreign_keys=[reported_by])
    resolver: Mapped[Optional["User"]] = relationship("User", foreign_keys=[resolved_by])

    __table_args__ = (
        Index("ix_incidents_status_severity", "status", "severity"),
    )
