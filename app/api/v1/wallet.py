import uuid
from typing import Any, Dict
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/wallet", tags=["Wallet & Escrow Payments"])


class TopUpRequest(BaseModel):
    amount_credits: int = Field(..., ge=50, le=50000, description="Amount in credits (₹1 = 1 credit = 100 minor units)")
    idempotency_key: str = Field(default_factory=lambda: str(uuid.uuid4()))


@router.get(
    "/me",
    summary="Get authenticated user's credit balance and append-only financial ledger",
)
async def get_my_wallet(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    payment_service = PaymentService(session)
    return await payment_service.get_wallet_with_ledger(current_user.id)


@router.post(
    "/topup",
    status_code=status.HTTP_200_OK,
    summary="Top-up wallet with platform credits (internal credits, zero real-world payment required)",
)
async def top_up_credits(
    req: TopUpRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    payment_service = PaymentService(session)
    amount_minor = req.amount_credits * 100
    wallet = await payment_service.top_up_wallet(
        user_id=current_user.id,
        amount_minor_units=amount_minor,
        idempotency_key=req.idempotency_key,
        description=f"Added {req.amount_credits} platform credits",
        actor=current_user,
    )
    return {
        "success": True,
        "new_balance_minor": wallet.balance_minor_units,
        "new_balance_display": f"₹{wallet.balance_minor_units / 100:.2f}",
        "credits_added": req.amount_credits,
    }


@router.get(
    "/owner/earnings",
    summary="Get owner earnings summary, completed reservation payouts, and escrow held funds",
)
async def get_owner_earnings(
    current_user: User = Depends(require_roles("owner", "admin")),
    session: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    payment_service = PaymentService(session)
    return await payment_service.get_owner_earnings_summary(current_user.id)

