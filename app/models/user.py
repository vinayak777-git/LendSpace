from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class User(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """User account across roles: booker, owner, admin."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    business_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(50), default="booker", nullable=False)  # booker, owner, admin
    org_id: Mapped[Optional[str]] = mapped_column(ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False, index=True)  # active, suspended, pending_verification
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    privacy_settings: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Reputation & Platform verification
    is_verified_by_platform: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completed_bookings_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    average_rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Relationships
    organization: Mapped[Optional["Organization"]] = relationship("Organization", back_populates="users")
    credentials: Mapped[List["Credential"]] = relationship(
        "Credential",
        back_populates="user",
        foreign_keys="Credential.user_id",
        cascade="all, delete-orphan",
    )
    owned_resources: Mapped[List["Resource"]] = relationship("Resource", back_populates="owner")
    bookings: Mapped[List["Booking"]] = relationship("Booking", back_populates="user", foreign_keys="Booking.user_id")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    wallet: Mapped[Optional["Wallet"]] = relationship("Wallet", back_populates="user", uselist=False, cascade="all, delete-orphan")
    reviews_authored: Mapped[List["Review"]] = relationship("Review", foreign_keys="Review.author_id", back_populates="author")

    __table_args__ = (
        Index("ix_users_user_id_status", "id", "status"),
        Index("ix_users_role_status", "role", "status"),
    )
