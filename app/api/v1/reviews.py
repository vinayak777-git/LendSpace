from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.booking import Booking
from app.models.resource import Resource
from app.models.review import Review
from app.models.user import User

router = APIRouter(prefix="/reviews", tags=["Reviews & Reputation"])


class ReviewCreate(BaseModel):
    booking_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=3, max_length=1000)


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Submit a verified review after completed reservation",
)
async def create_review(
    req: ReviewCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    # 1. Booking must exist and belong to user
    stmt = (
        select(Booking)
        .options(selectinload(Booking.resource), selectinload(Booking.review))
        .where(Booking.id == req.booking_id)
    )
    booking = (await session.execute(stmt)).scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only review reservations you completed.")

    if booking.status != "returned":
        raise HTTPException(status_code=400, detail="Reviews can only be submitted after the reservation is completed and returned.")

    if booking.review is not None:
        raise HTTPException(status_code=409, detail="A review has already been submitted for this reservation.")

    review = Review(
        booking_id=booking.id,
        author_id=current_user.id,
        resource_id=booking.resource_id,
        rating=req.rating,
        comment=req.comment.strip(),
    )
    session.add(review)
    await session.flush()

    # Recalculate resource owner's average rating
    owner_id = booking.resource.owner_id
    stmt_avg = (
        select(func.avg(Review.rating))
        .join(Resource, Review.resource_id == Resource.id)
        .where(Resource.owner_id == owner_id)
    )
    avg_rating = (await session.execute(stmt_avg)).scalar() or 0.0

    stmt_owner = select(User).where(User.id == owner_id)
    owner = (await session.execute(stmt_owner)).scalar_one_or_none()
    if owner:
        owner.average_rating = round(float(avg_rating), 1)

    return {
        "id": review.id,
        "booking_id": review.booking_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at.isoformat(),
    }


@router.get(
    "/resource/{resource_id}",
    summary="Get verified reviews for a resource",
)
async def list_resource_reviews(
    resource_id: str,
    limit: int = Query(20, ge=1, le=50),
    session: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    stmt = (
        select(Review)
        .options(selectinload(Review.author))
        .where(Review.resource_id == resource_id)
        .order_by(Review.created_at.desc())
        .limit(limit)
    )
    reviews = list((await session.execute(stmt)).scalars().all())
    return [
        {
            "id": r.id,
            "rating": r.rating,
            "comment": r.comment,
            "author_name": r.author.full_name if r.author else "Verified User",
            "created_at": r.created_at.isoformat(),
        }
        for r in reviews
    ]

