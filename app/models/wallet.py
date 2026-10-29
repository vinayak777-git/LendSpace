from typing import Optional
from sqlalchemy import ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDMixin


class Wallet(Base, UUIDMixin, TimestampMixin):
    """User in-app credit wallet for escrow holds, top-ups, and payout credits."""

    __tablename__ = "wallets"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )
    balance_minor_units: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="₹", nullable=False)

    # Relationships
    user = relationship("User", back_populates="wallet")
    entries = relationship("LedgerEntry", back_populates="wallet", cascade="all, delete-orphan")


class LedgerEntry(Base, UUIDMixin, TimestampMixin):
    """Append-only audit-safe financial ledger recording all movements in minor units."""

    __tablename__ = "ledger_entries"

    wallet_id: Mapped[str] = mapped_column(
        ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    booking_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True
    )
    type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # topup, hold, release, refund, payout
    amount_minor_units: Mapped[int] = mapped_column(Integer, nullable=False)
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)
    idempotency_key: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    wallet = relationship("Wallet", back_populates="entries")
    booking = relationship("Booking")

    __table_args__ = (
        Index("ix_ledger_wallet_type", "wallet_id", "type"),
    )

