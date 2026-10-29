from sqlalchemy import ForeignKey, Index, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDMixin


class Review(Base, UUIDMixin, TimestampMixin):
    """Post-completion peer review building platform trust and verified reputational scores."""

    __tablename__ = "reviews"

    booking_id: Mapped[str] = mapped_column(
        ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    author_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    resource_id: Mapped[str] = mapped_column(
        ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    booking = relationship("Booking", back_populates="review")
    author = relationship("User", foreign_keys=[author_id], back_populates="reviews_authored")
    resource = relationship("Resource")

    __table_args__ = (
        Index("ix_reviews_resource_rating", "resource_id", "rating"),
    )

