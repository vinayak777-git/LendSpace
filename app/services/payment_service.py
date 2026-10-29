import asyncio
from datetime import datetime
import math
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.errors import ConflictError, LendSpaceException
from app.models.audit import AuditEvent
from app.models.booking import Booking
from app.models.resource import Resource
from app.models.user import User
from app.models.wallet import LedgerEntry, Wallet
from app.repositories.audit_repo import AuditRepository

_wallet_locks: Dict[str, asyncio.Lock] = {}


def _get_wallet_lock(user_id: str) -> asyncio.Lock:
    if user_id not in _wallet_locks:
        _wallet_locks[user_id] = asyncio.Lock()
    return _wallet_locks[user_id]


class InsufficientFundsError(LendSpaceException):
    def __init__(self, message: str, required_amount: int, current_balance: int):
        super().__init__(
            message=message,
            code="INSUFFICIENT_FUNDS",
            status_code=400,
            extra={"required_amount": required_amount, "current_balance": current_balance},
        )


class PaymentService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.audit_repo = AuditRepository(session)

    async def get_or_create_wallet(self, user_id: str, lock: bool = False) -> Wallet:
        stmt = select(Wallet).where(Wallet.user_id == user_id)
        if lock and not self.session.bind.dialect.name.startswith("sqlite"):
            stmt = stmt.with_for_update()

        res = await self.session.execute(stmt)
        wallet = res.scalar_one_or_none()
        if not wallet:
            wallet = Wallet(user_id=user_id, balance_minor_units=0, currency="₹")
            self.session.add(wallet)
            await self.session.flush()
        return wallet

    def calculate_booking_cost(
        self, resource: Resource, start_at: datetime, end_at: datetime
    ) -> Dict[str, int]:
        """Calculates server-side total rent and deposit strictly in minor units (paise/cents).
        Never trust client totals.
        """
        duration_hours = max(0.5, (end_at - start_at).total_seconds() / 3600.0)

        rent_minor = 0
        if resource.pricing_model == "free":
            rent_minor = 0
        elif resource.pricing_model == "daily":
            days = max(1, math.ceil(duration_hours / 24.0))
            rent_minor = int(round(resource.daily_rate * days * 100))
        elif resource.pricing_model == "flat":
            rent_minor = int(round(resource.hourly_rate * 100))
        else:  # 'hourly' default
            rent_minor = int(round(resource.hourly_rate * duration_hours * 100))

        deposit_minor = int(round(resource.deposit_amount * 100))
        total_hold = rent_minor + deposit_minor

        return {
            "rent_minor_units": rent_minor,
            "deposit_minor_units": deposit_minor,
            "total_hold_minor_units": total_hold,
            "duration_hours": int(duration_hours),
        }

    async def top_up_wallet(
        self,
        user_id: str,
        amount_minor_units: int,
        idempotency_key: str,
        description: str = "Platform credits top-up",
        actor: Optional[User] = None,
    ) -> Wallet:
        if amount_minor_units <= 0:
            raise ValueError("Top-up amount must be positive.")

        # Check idempotency
        stmt_dup = select(LedgerEntry).where(LedgerEntry.idempotency_key == idempotency_key)
        existing = (await self.session.execute(stmt_dup)).scalar_one_or_none()
        if existing:
            return await self.get_or_create_wallet(user_id)

        wallet = await self.get_or_create_wallet(user_id, lock=True)
        wallet.balance_minor_units += amount_minor_units
        new_balance = wallet.balance_minor_units

        entry = LedgerEntry(
            wallet_id=wallet.id,
            type="topup",
            amount_minor_units=amount_minor_units,
            balance_after=new_balance,
            idempotency_key=idempotency_key,
            description=description,
        )
        self.session.add(entry)

        audit = AuditEvent(
            actor_id=actor.id if actor else user_id,
            actor_role="user",
            action="WALLET_TOPUP",
            entity_type="wallet",
            entity_id=wallet.id,
            reason=f"Top-up +₹{amount_minor_units / 100:.2f} ({description})",
            metadata={"amount_minor_units": amount_minor_units, "new_balance": new_balance},
        )
        await self.audit_repo.log_event(audit)
        await self.session.flush()
        return wallet

    async def hold_escrow(
        self, booking: Booking, resource: Resource, booker: User
    ) -> Tuple[int, int]:
        """Places a server-side escrow hold (rent + deposit) on the booker's wallet."""
        cost = self.calculate_booking_cost(resource, booking.start_at, booking.end_at)
        total_hold = cost["total_hold_minor_units"]

        if total_hold == 0:
            booking.total_price_minor_units = 0
            booking.deposit_minor_units = 0
            booking.payment_status = "none"
            return (0, 0)

        async with _get_wallet_lock(booker.id):
            wallet = await self.get_or_create_wallet(booker.id, lock=True)
            if wallet.balance_minor_units < total_hold:
                raise InsufficientFundsError(
                    message=f"Insufficient platform credits. Total hold required: ₹{total_hold / 100:.2f} "
                            f"(Rent: ₹{cost['rent_minor_units'] / 100:.2f}, Deposit: ₹{cost['deposit_minor_units'] / 100:.2f}). "
                            f"Current balance: ₹{wallet.balance_minor_units / 100:.2f}.",
                    required_amount=total_hold,
                    current_balance=wallet.balance_minor_units,
                )

            wallet.balance_minor_units -= total_hold
            new_balance = wallet.balance_minor_units

            entry = LedgerEntry(
                wallet_id=wallet.id,
                booking_id=booking.id,
                type="hold",
                amount_minor_units=-total_hold,
                balance_after=new_balance,
                idempotency_key=f"hold_{booking.id}",
                description=f"Escrow hold for reservation '{resource.title}'",
            )
            self.session.add(entry)

            booking.total_price_minor_units = cost["rent_minor_units"]
            booking.deposit_minor_units = cost["deposit_minor_units"]
            booking.payment_status = "held"

            audit = AuditEvent(
                actor_id=booker.id,
                actor_role="booker",
                action="ESCROW_HELD",
                entity_type="booking",
                entity_id=booking.id,
                reason=f"Escrow hold of ₹{total_hold / 100:.2f} secured from booker wallet",
                metadata={"rent": cost["rent_minor_units"], "deposit": cost["deposit_minor_units"]},
            )
            await self.audit_repo.log_event(audit)
            await self.session.flush()
            return (cost["rent_minor_units"], cost["deposit_minor_units"])

    async def release_escrow(self, booking: Booking, actor: User) -> None:
        """Upon booking return/completion, pays rent to owner and refunds security deposit to booker."""
        if booking.payment_status != "held":
            return

        rent = booking.total_price_minor_units
        deposit = booking.deposit_minor_units

        # 1. Payout rent to Owner
        if rent > 0:
            resource = booking.resource
            owner_wallet = await self.get_or_create_wallet(resource.owner_id, lock=True)
            owner_wallet.balance_minor_units += rent
            entry_payout = LedgerEntry(
                wallet_id=owner_wallet.id,
                booking_id=booking.id,
                type="payout",
                amount_minor_units=rent,
                balance_after=owner_wallet.balance_minor_units,
                idempotency_key=f"payout_{booking.id}",
                description=f"Rent payout for completed reservation on '{resource.title}'",
            )
            self.session.add(entry_payout)

        # 2. Refund security deposit to Booker
        if deposit > 0:
            booker_wallet = await self.get_or_create_wallet(booking.user_id, lock=True)
            booker_wallet.balance_minor_units += deposit
            entry_refund = LedgerEntry(
                wallet_id=booker_wallet.id,
                booking_id=booking.id,
                type="refund",
                amount_minor_units=deposit,
                balance_after=booker_wallet.balance_minor_units,
                idempotency_key=f"deposit_refund_{booking.id}",
                description=f"Security deposit refund for clean return on booking {booking.id}",
            )
            self.session.add(entry_refund)

        booking.payment_status = "released"

        audit = AuditEvent(
            actor_id=actor.id,
            actor_role=actor.role,
            action="ESCROW_SETTLED",
            entity_type="booking",
            entity_id=booking.id,
            reason=f"Settled: Rent ₹{rent / 100:.2f} paid to owner, deposit ₹{deposit / 100:.2f} refunded to booker",
        )
        await self.audit_repo.log_event(audit)
        await self.session.flush()

    async def refund_escrow(self, booking: Booking, reason: str, actor: User) -> None:
        """Upon booking rejection, cancellation, or expiry, releases full hold back to booker."""
        if booking.payment_status != "held":
            return

        total_held = booking.total_price_minor_units + booking.deposit_minor_units
        if total_held > 0:
            booker_wallet = await self.get_or_create_wallet(booking.user_id, lock=True)
            booker_wallet.balance_minor_units += total_held
            entry_refund = LedgerEntry(
                wallet_id=booker_wallet.id,
                booking_id=booking.id,
                type="refund",
                amount_minor_units=total_held,
                balance_after=booker_wallet.balance_minor_units,
                idempotency_key=f"full_refund_{booking.id}",
                description=f"Full escrow refund: {reason}",
            )
            self.session.add(entry_refund)

        booking.payment_status = "refunded"

        audit = AuditEvent(
            actor_id=actor.id,
            actor_role=actor.role,
            action="ESCROW_REFUNDED",
            entity_type="booking",
            entity_id=booking.id,
            reason=f"Full escrow refund of ₹{total_held / 100:.2f} returned to booker: {reason}",
        )
        await self.audit_repo.log_event(audit)
        await self.session.flush()

    async def get_wallet_with_ledger(self, user_id: str) -> Dict[str, Any]:
        wallet = await self.get_or_create_wallet(user_id)
        stmt = (
            select(LedgerEntry)
            .where(LedgerEntry.wallet_id == wallet.id)
            .order_by(LedgerEntry.created_at.desc())
        )
        res = await self.session.execute(stmt)
        entries = list(res.scalars().all())

        return {
            "id": wallet.id,
            "user_id": wallet.user_id,
            "balance_minor_units": wallet.balance_minor_units,
            "balance_display": f"₹{wallet.balance_minor_units / 100:.2f}",
            "currency": wallet.currency,
            "entries": [
                {
                    "id": e.id,
                    "type": e.type,
                    "amount_minor_units": e.amount_minor_units,
                    "amount_display": f"{'+' if e.amount_minor_units > 0 else ''}₹{e.amount_minor_units / 100:.2f}",
                    "balance_after": e.balance_after,
                    "balance_after_display": f"₹{e.balance_after / 100:.2f}",
                    "description": e.description,
                    "created_at": e.created_at.isoformat(),
                }
                for e in entries
            ],
            "ledger": [
                {
                    "id": e.id,
                    "type": e.type,
                    "amount_minor_units": e.amount_minor_units,
                    "amount_display": f"{'+' if e.amount_minor_units > 0 else ''}₹{e.amount_minor_units / 100:.2f}",
                    "balance_after": e.balance_after,
                    "balance_after_display": f"₹{e.balance_after / 100:.2f}",
                    "description": e.description,
                    "created_at": e.created_at.isoformat(),
                }
                for e in entries
            ],
        }

    async def get_owner_earnings_summary(self, owner_id: str) -> Dict[str, Any]:
        wallet = await self.get_or_create_wallet(owner_id)
        # Sum of payouts
        stmt_payouts = (
            select(LedgerEntry)
            .where(LedgerEntry.wallet_id == wallet.id, LedgerEntry.type == "payout")
        )
        payout_entries = list((await self.session.execute(stmt_payouts)).scalars().all())
        total_earned_minor = sum(e.amount_minor_units for e in payout_entries)

        # Sum of active bookings currently held in escrow
        stmt_held = (
            select(Booking)
            .join(Resource, Booking.resource_id == Resource.id)
            .where(Resource.owner_id == owner_id, Booking.payment_status == "held")
        )
        held_bookings = list((await self.session.execute(stmt_held)).scalars().all())
        pending_escrow_minor = sum(b.total_price_minor_units for b in held_bookings)

        return {
            "wallet_balance_minor": wallet.balance_minor_units,
            "wallet_balance_display": f"₹{wallet.balance_minor_units / 100:.2f}",
            "total_earned_minor": total_earned_minor,
            "total_earned_display": f"₹{total_earned_minor / 100:.2f}",
            "pending_escrow_minor": pending_escrow_minor,
            "pending_escrow_display": f"₹{pending_escrow_minor / 100:.2f}",
            "currency": wallet.currency,
            "completed_reservations_count": len(payout_entries),
        }
