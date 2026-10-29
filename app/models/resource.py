from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, JSON, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class Resource(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Sharable campus asset: 3D printer, laser cutter, bench tool, meeting space, wet lab."""

    __tablename__ = "resources"

    org_id: Mapped[Optional[str]] = mapped_column(ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String(50), default="equipment", nullable=False)  # equipment, space, device, tool, lab
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    building: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    room: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    asset_tag: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    condition_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    images: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="live", nullable=False, index=True)  # draft, pending_verification, live, paused, archived
    approval_mode: Mapped[str] = mapped_column(String(50), default="manual", nullable=False)  # auto, manual
    supervision_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deposit_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    max_hours_per_booking: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    max_hours_per_week_per_user: Mapped[int] = mapped_column(Integer, default=12, nullable=False)
    cooldown_hours: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_advance_days: Mapped[int] = mapped_column(Integer, default=14, nullable=False)
    buffer_minutes: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    allowed_audience: Mapped[str] = mapped_column(String(50), default="anyone_verified", nullable=False)  # anyone_verified, org_only, approved_list
    waitlist_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    safety_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    usage_rules: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    condition_checklist: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)

    # Custom Pricing & Dimension Fields
    hourly_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    daily_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    pricing_model: Mapped[str] = mapped_column(String(50), default="hourly", nullable=False)  # free, hourly, daily, flat
    currency: Mapped[str] = mapped_column(String(10), default="₹", nullable=False)
    area_sq_ft: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    organization: Mapped[Optional["Organization"]] = relationship("Organization", back_populates="resources")
    owner: Mapped["User"] = relationship("User", back_populates="owned_resources", lazy="selectin")
    requirements: Mapped[List["ResourceRequirement"]] = relationship(
        "ResourceRequirement",
        back_populates="resource",
        cascade="all, delete-orphan",
    )
    availability_windows: Mapped[List["AvailabilityWindow"]] = relationship(
        "AvailabilityWindow",
        back_populates="resource",
        cascade="all, delete-orphan",
    )
    blackout_dates: Mapped[List["BlackoutDate"]] = relationship(
        "BlackoutDate",
        back_populates="resource",
        cascade="all, delete-orphan",
    )
    managers: Mapped[List["ResourceManager"]] = relationship(
        "ResourceManager",
        back_populates="resource",
        cascade="all, delete-orphan",
    )
    bookings: Mapped[List["Booking"]] = relationship("Booking", back_populates="resource")

    __table_args__ = (
        Index("ix_resources_owner_status", "owner_id", "status"),
        Index("ix_resources_category_status", "category", "status"),
    )


class ResourceRequirement(Base, UUIDMixin, TimestampMixin):
    """Precondition required for a user to book this resource."""

    __tablename__ = "resource_requirements"

    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # training, membership, qualification, id, faculty_approval
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    required_credential_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    resource: Mapped["Resource"] = relationship("Resource", back_populates="requirements")


class AvailabilityWindow(Base, UUIDMixin, TimestampMixin):
    """Recurring operational hours by weekday (0=Monday, 6=Sunday)."""

    __tablename__ = "availability_windows"

    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    weekday: Mapped[int] = mapped_column(Integer, nullable=False)  # 0 to 6
    start_time: Mapped[str] = mapped_column(String(8), nullable=False)  # e.g., "08:00"
    end_time: Mapped[str] = mapped_column(String(8), nullable=False)  # e.g., "20:00"

    resource: Mapped["Resource"] = relationship("Resource", back_populates="availability_windows")


class BlackoutDate(Base, UUIDMixin, TimestampMixin):
    """Facility maintenance, holiday, or closure window."""

    __tablename__ = "blackout_dates"

    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=False)

    resource: Mapped["Resource"] = relationship("Resource", back_populates="blackout_dates")


class ResourceManager(Base, UUIDMixin, TimestampMixin):
    """Delegated permissions for team members on a resource."""

    __tablename__ = "resource_managers"

    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    can_approve: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    can_confirm_returns: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    can_handle_incidents: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    resource: Mapped["Resource"] = relationship("Resource", back_populates="managers")
    user: Mapped["User"] = relationship("User")
