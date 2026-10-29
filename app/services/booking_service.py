from datetime import datetime, time, timedelta, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.errors import (
    ConflictError,
    EligibilityError,
    InvalidStateTransitionError,
    NotFoundError,
    PermissionDeniedError,
)
from app.models.audit import AuditEvent
from app.models.booking import Booking
from app.models.notification import Notification
from app.models.resource import Resource
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.repositories.booking_repo import BookingRepository
from app.repositories.credential_repo import CredentialRepository
from app.repositories.ledger_repo import UsageLedgerRepository
from app.repositories.notification_repo import NotificationRepository
from app.repositories.resource_repo import ResourceRepository
from app.rules.conflicts import check_conflicts
from app.rules.eligibility import check_eligibility
from app.rules.fairness import calculate_priority_score
from app.rules.state_machine import validate_booking_transition
from app.schemas.booking import BookingAction, BookingCreate
from app.services.outbox_service import OutboxService
from app.services.payment_service import PaymentService
from app.services.waitlist_service import WaitlistService


import asyncio

_resource_locks: Dict[str, asyncio.Lock] = {}


def _get_resource_lock(resource_id: str) -> asyncio.Lock:
    if resource_id not in _resource_locks:
        _resource_locks[resource_id] = asyncio.Lock()
    return _resource_locks[resource_id]


class BookingService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.booking_repo = BookingRepository(session)
        self.resource_repo = ResourceRepository(session)
        self.credential_repo = CredentialRepository(session)
        self.audit_repo = AuditRepository(session)
        self.notif_repo = NotificationRepository(session)
        self.ledger_repo = UsageLedgerRepository(session)
        self.waitlist_service = WaitlistService(session)
        self.payment_service = PaymentService(session)
        self.outbox_service = OutboxService(session)

    async def get_booking_details(self, booking_id: str) -> Booking:
        booking = await self.booking_repo.get_with_details(booking_id)
        if not booking:
            raise NotFoundError("Booking not found", entity="Booking", entity_id=booking_id)
        return booking

    async def check_user_eligibility(
        self, resource_id: str, user: User
    ) -> Dict[str, Any]:
        resource = await self.resource_repo.get_with_details(resource_id)
        if not resource or resource.is_deleted:
            raise NotFoundError("Resource not found", entity="Resource", entity_id=resource_id)

        user_credentials = await self.credential_repo.list_for_user(user.id)
        return check_eligibility(
            user=user,
            resource=resource,
            user_credentials=user_credentials,
        )

    async def check_booking_conflicts(
        self,
        resource_id: str,
        start_at: datetime,
        end_at: datetime,
        exclude_booking_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        resource = await self.resource_repo.get_with_details(resource_id)
        if not resource or resource.is_deleted:
            raise NotFoundError("Resource not found", entity="Resource", entity_id=resource_id)

        # Retrieve blocking bookings within relevant temporal radius
        window_start = start_at - timedelta(days=2)
        window_end = end_at + timedelta(days=2)
        existing_bookings = await self.booking_repo.list_for_resource(
            resource_id=resource_id,
            start_after=window_start,
            end_before=window_end,
        )

        return check_conflicts(
            resource=resource,
            requested_start=start_at,
            requested_end=end_at,
            existing_bookings=existing_bookings,
            blackout_dates=resource.blackout_dates,
            buffer_minutes=resource.buffer_minutes,
            exclude_booking_id=exclude_booking_id,
        )

    async def create_booking(
        self, data: BookingCreate, user: User, ip: Optional[str] = None
    ) -> Booking:
        resource = await self.resource_repo.get_with_details(data.resource_id)
        if not resource or resource.is_deleted:
            raise NotFoundError("Resource not found", entity="Resource", entity_id=data.resource_id)

        # 1. Eligibility evaluation
        user_credentials = await self.credential_repo.list_for_user(user.id)
        eligibility = check_eligibility(user, resource, user_credentials)
        if not eligibility["eligible"]:
            failed_reasons = [
                c["reason"] for c in eligibility["checks"] if not c["passed"]
            ]
            raise EligibilityError(
                message=f"Eligibility check failed: {'; '.join(failed_reasons)}",
                checks=eligibility["checks"],
            )

        lock = _get_resource_lock(data.resource_id)
        async with lock:
            # 2. Concurrency check with pessimistic row locking
            overlapping = await self.booking_repo.get_overlapping_for_update(
                resource_id=data.resource_id,
                start_at=data.start_at,
                end_at=data.end_at,
            )
            if overlapping:
                raise ConflictError(
                    message="This time slot is already reserved or pending approval. Please select an alternate slot.",
                    extra={"conflicting_booking_ids": [b.id for b in overlapping]},
                )

            # 3. Comprehensive pure rule conflict analysis
            conflict_result = await self.check_booking_conflicts(
                resource_id=data.resource_id,
                start_at=data.start_at,
                end_at=data.end_at,
            )
            if conflict_result["has_conflict"]:
                raise ConflictError(
                    message="; ".join(conflict_result["reasons"]),
                    extra={"suggested_slots": conflict_result["suggested_slots"]},
                )

            # 4. Fairness check: user weekly quota limit
            duration_hours = (data.end_at - data.start_at).total_seconds() / 3600.0
            # Calculate calendar week start (Monday midnight UTC)
            start_date = data.start_at.date()
            monday = start_date - timedelta(days=start_date.weekday())
            week_start_dt = datetime.combine(monday, time.min, tzinfo=timezone.utc)

            current_weekly_hours = await self.ledger_repo.get_weekly_usage_hours(
                user_id=user.id,
                resource_id=resource.id,
                week_start=week_start_dt,
            )
            if current_weekly_hours + duration_hours > resource.max_hours_per_week_per_user:
                raise ConflictError(
                    f"Booking exceeds maximum allowed weekly limit of {resource.max_hours_per_week_per_user} hours. "
                    f"Currently used: {current_weekly_hours:.1f}h, Requested: {duration_hours:.1f}h."
                )

            # 5. Priority score computation
            has_safety_badge = any(
                c.type == "training" and c.status == "verified" for c in user_credentials
            )
            priority_score, score_breakdown = calculate_priority_score(
                purpose=data.purpose,
                is_academic=data.is_academic,
                has_safety_badge=has_safety_badge,
                hours_used_this_week=current_weekly_hours,
                waiting_hours=0.0,
                strikes_count=0,
            )

            # 6. Auto-approval logic
            has_faculty_req = any(r.type == "faculty_approval" for r in resource.requirements)
            if resource.approval_mode == "auto" and not has_faculty_req:
                initial_status = "approved"
            else:
                initial_status = "pending"

            booking = Booking(
                resource_id=resource.id,
                user_id=user.id,
                start_at=data.start_at,
                end_at=data.end_at,
                purpose=data.purpose.strip(),
                status=initial_status,
                priority_score=priority_score,
                score_breakdown=score_breakdown,
            )
            created_booking = await self.booking_repo.create(booking)
            await self.session.flush()

            # Escrow hold: compute server-side cost and hold credits in booker wallet
            await self.payment_service.hold_escrow(booking=created_booking, resource=resource, booker=user)

            await self.session.commit()

        # 7. Audit log in same transaction
        action_name = "BOOKING_AUTO_APPROVED" if initial_status == "approved" else "BOOKING_CREATED"
        audit = AuditEvent(
            actor_id=user.id,
            actor_role=user.role,
            action=action_name,
            entity_type="booking",
            entity_id=created_booking.id,
            booking_id=created_booking.id,
            reason=f"Reservation created with status '{initial_status}'",
            ip=ip,
            after={
                "status": initial_status,
                "start_at": data.start_at.isoformat(),
                "end_at": data.end_at.isoformat(),
                "priority_score": priority_score,
                "payment_status": created_booking.payment_status,
                "total_price_minor_units": created_booking.total_price_minor_units,
            },
        )
        await self.audit_repo.log_event(audit)

        # 8. In-app notification to Booker
        notif_title = "Reservation Confirmed" if initial_status == "approved" else "Reservation Submitted"
        notif_body = (
            f"Your booking for {resource.title} on {data.start_at.strftime('%b %d, %H:%M')} has been {initial_status}."
        )
        user_notif = Notification(
            user_id=user.id,
            type="booking_created",
            title=notif_title,
            body=notif_body,
            entity_type="booking",
            entity_id=created_booking.id,
        )
        await self.notif_repo.create(user_notif)

        # 9. Email dispatch via local outbox (.eml file) to Booker
        await self.outbox_service.enqueue_email(
            to_email=user.email,
            subject=f"LendSpace: {notif_title} for {resource.title}",
            body=(
                f"Hello {user.full_name},\n\n"
                f"Your reservation for {resource.title} from {data.start_at.strftime('%Y-%m-%d %H:%M UTC')} "
                f"to {data.end_at.strftime('%Y-%m-%d %H:%M UTC')} has been recorded as '{initial_status.upper()}'.\n\n"
                f"Priority Allocation Score: {priority_score}\n"
                f"Escrow Payment Status: {created_booking.payment_status.upper()}\n"
                f"Total Price: ₹{created_booking.total_price_minor_units / 100:.2f}\n\n"
                f"Regards,\nLendSpace Platform"
            ),
            user_id=user.id,
        )

        # 10. Notification and Outbox Email to Resource Owner
        if resource.owner:
            owner_notif = Notification(
                user_id=resource.owner_id,
                type="booking_created",
                title=f"New Reservation Request: {resource.title}",
                body=f"Requester {user.full_name} ({user.email}) requested {resource.title}.",
                entity_type="booking",
                entity_id=created_booking.id,
            )
            await self.notif_repo.create(owner_notif)
            if resource.owner.email:
                await self.outbox_service.enqueue_email(
                    to_email=resource.owner.email,
                    subject=f"LendSpace: New Reservation Request for {resource.title}",
                    body=(
                        f"Hello {resource.owner.full_name},\n\n"
                        f"A new booking request has been submitted by {user.full_name} ({user.email}) "
                        f"for your resource '{resource.title}'.\n\n"
                        f"Time Slot: {data.start_at.strftime('%Y-%m-%d %H:%M UTC')} - {data.end_at.strftime('%Y-%m-%d %H:%M UTC')}\n"
                        f"Purpose: {data.purpose}\n"
                        f"Priority Allocation Score: {priority_score}\n\n"
                        f"Please review and approve this request in your Owner Dashboard.\n\n"
                        f"Regards,\nLendSpace Platform"
                    ),
                    user_id=resource.owner_id,
                )

        # If auto-approved, book hours into usage ledger
        if initial_status == "approved":
            await self.ledger_repo.record_usage(
                user_id=user.id,
                resource_id=resource.id,
                booking_id=created_booking.id,
                hours=duration_hours,
                week_start=week_start_dt,
            )

        return created_booking

    async def transition_booking(
        self,
        booking_id: str,
        target_status: str,
        action: BookingAction,
        actor: User,
        ip: Optional[str] = None,
    ) -> Booking:
        booking = await self.get_booking_details(booking_id)

        # Determine if actor has resource manager delegation
        resource = booking.resource
        is_manager = actor.role in ["owner", "admin"] or any(
            m.user_id == actor.id for m in resource.managers
        )

        # Enforce state machine rules (HTTP 409 on invalid transition)
        validate_booking_transition(
            current_status=booking.status,
            target_status=target_status,
            actor_role=actor.role,
            actor_id=actor.id,
            booking_user_id=booking.user_id,
            is_resource_manager=is_manager,
        )

        before_state = {"status": booking.status}
        now = datetime.now(timezone.utc)

        # Specific transition mutations
        if target_status == "approved":
            # Re-verify no race condition overlap
            overlapping = await self.booking_repo.get_overlapping_for_update(
                resource_id=booking.resource_id,
                start_at=booking.start_at,
                end_at=booking.end_at,
                exclude_id=booking.id,
            )
            if overlapping:
                raise ConflictError(
                    "Cannot approve booking: resource slot is already reserved by another booking."
                )
            booking.decision_by = actor.id
            booking.decision_reason = action.reason
            duration_hours = (booking.end_at - booking.start_at).total_seconds() / 3600.0
            start_date = booking.start_at.date()
            monday = start_date - timedelta(days=start_date.weekday())
            week_start_dt = datetime.combine(monday, time.min, tzinfo=timezone.utc)
            await self.ledger_repo.record_usage(
                user_id=booking.user_id,
                resource_id=booking.resource_id,
                booking_id=booking.id,
                hours=duration_hours,
                week_start=week_start_dt,
            )

        elif target_status == "rejected":
            booking.decision_by = actor.id
            booking.decision_reason = action.reason
            await self.payment_service.refund_escrow(
                booking=booking,
                reason=action.reason or "Reservation rejected by resource manager",
                actor=actor,
            )

        elif target_status == "cancelled":
            booking.cancelled_reason = action.reason
            await self.payment_service.refund_escrow(
                booking=booking,
                reason=action.reason or "Reservation cancelled",
                actor=actor,
            )
            # Trigger waitlist promotion when slot frees up
            await self.waitlist_service.promote_next_candidate(
                resource_id=booking.resource_id,
                slot_start=booking.start_at,
                slot_end=booking.end_at,
            )

        elif target_status == "checked_in":
            booking.checked_in_at = now

        elif target_status in ["returned", "completed"]:
            booking.returned_at = now
            await self.payment_service.release_escrow(booking=booking, actor=actor)
            if booking.user:
                booking.user.completed_bookings_count = (booking.user.completed_bookings_count or 0) + 1
            if resource.owner:
                resource.owner.completed_bookings_count = (resource.owner.completed_bookings_count or 0) + 1

        booking.status = target_status
        updated_booking = await self.booking_repo.update(
            booking,
            {
                "status": booking.status,
                "decision_by": booking.decision_by,
                "decision_reason": booking.decision_reason,
                "cancelled_reason": booking.cancelled_reason,
                "checked_in_at": booking.checked_in_at,
                "returned_at": booking.returned_at,
            },
        )

        # Audit event
        audit = AuditEvent(
            actor_id=actor.id,
            actor_role=actor.role,
            action=f"BOOKING_{target_status.upper()}",
            entity_type="booking",
            entity_id=booking.id,
            booking_id=booking.id,
            before=before_state,
            after={"status": target_status, "reason": action.reason},
            reason=action.reason or f"Transitioned to {target_status}",
            ip=ip,
        )
        await self.audit_repo.log_event(audit)

        # Notification to booker
        notif = Notification(
            user_id=booking.user_id,
            type=f"booking_{target_status}",
            title=f"Booking {target_status.replace('_', ' ').capitalize()}",
            body=f"Your booking for '{resource.title}' is now {target_status}. Reason: {action.reason or 'None'}",
            entity_type="booking",
            entity_id=booking.id,
        )
        await self.notif_repo.create(notif)

        # Enqueue email notification via local outbox (.eml file)
        if booking.user and booking.user.email:
            await self.outbox_service.enqueue_email(
                to_email=booking.user.email,
                subject=f"LendSpace: Booking {target_status.replace('_', ' ').capitalize()} - {resource.title}",
                body=(
                    f"Hello {booking.user.full_name},\n\n"
                    f"Your booking for '{resource.title}' has been updated to: {target_status.upper()}.\n"
                    f"Action note / Reason: {action.reason or 'No additional notes provided'}\n"
                    f"Payment Status: {booking.payment_status.upper()}\n\n"
                    f"Regards,\nLendSpace Platform"
                ),
                user_id=booking.user_id,
            )

        return updated_booking

    async def list_user_bookings(
        self, user_id: str, status: Optional[str] = None, limit: int = 50, offset: int = 0
    ) -> List[Booking]:
        return await self.booking_repo.list_for_user(
            user_id=user_id, status=status, limit=limit, offset=offset
        )

    async def list_owner_bookings(
        self, owner_id: str, status: Optional[str] = None, limit: int = 50, offset: int = 0
    ) -> List[Booking]:
        return await self.booking_repo.list_for_owner(
            owner_id=owner_id, status=status, limit=limit, offset=offset
        )

    async def list_resource_bookings(
        self,
        resource_id: str,
        start_after: Optional[datetime] = None,
        end_before: Optional[datetime] = None,
    ) -> List[Booking]:
        return await self.booking_repo.list_for_resource(
            resource_id=resource_id, start_after=start_after, end_before=end_before
        )
