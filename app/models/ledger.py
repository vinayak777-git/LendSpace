from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Float, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDMixin


class UsageLedger(Base, UUIDMixin, TimestampMixin):
    """Accredited hourly consumption tracking per user and resource for fair-use governance."""

    __tablename__ = "usage_ledgers"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id: Mapped[Optional[str]] = mapped_column(ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    hours: Mapped[float] = mapped_column(Float, nullable=False)
    week_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    user: Mapped["User"] = relationship("User")
    resource: Mapped["Resource"] = relationship("Resource")
    booking: Mapped[Optional["Booking"]] = relationship("Booking")

    __table_args__ = (
        Index("ix_ledger_user_resource_week", "user_id", "resource_id", "week_start"),
    )
