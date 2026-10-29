from typing import Any, Dict, Set
from app.core.errors import InvalidStateTransitionError, PermissionDeniedError

# Legal state transitions map
VALID_TRANSITIONS: Dict[str, Set[str]] = {
    "pending": {"approved", "rejected", "waitlisted", "cancelled"},
    "waitlisted": {"pending", "approved", "cancelled", "expired"},
    "approved": {"checked_in", "cancelled", "no_show"},
    "checked_in": {"returned", "overdue"},
    "overdue": {"returned"},
    "returned": {"disputed", "closed"},
    # Terminal or resolved states
    "rejected": set(),
    "cancelled": set(),
    "expired": set(),
    "no_show": set(),
    "disputed": {"closed"},
    "closed": set(),
}

# Role permissions per target state transition
ROLE_TRANSITION_PERMISSIONS: Dict[str, Set[str]] = {
    "approved": {"owner", "manager", "admin"},
    "rejected": {"owner", "manager", "admin"},
    "waitlisted": {"owner", "manager", "admin", "system"},
    "cancelled": {"booker", "user", "owner", "manager", "admin", "system"},
    "checked_in": {"booker", "user", "owner", "manager", "admin"},
    "no_show": {"owner", "manager", "admin", "system"},
    "overdue": {"system", "owner", "manager", "admin"},
    "returned": {"booker", "user", "owner", "manager", "admin"},
    "disputed": {"booker", "user", "owner", "manager", "admin"},
    "closed": {"owner", "manager", "admin"},
    "expired": {"system", "owner", "manager", "admin"},
    "pending": {"system", "owner", "manager", "admin"},
}


def validate_booking_transition(
    current_status: str,
    target_status: str,
    actor_role: str,
    actor_id: str,
    booking_user_id: str,
    is_resource_manager: bool = False,
) -> None:
    """Validate a booking lifecycle transition.

    Enforces:
    1. Valid source -> target transition per the state machine.
    2. Actor role authorization for the target transition.
    3. User identity authorization (booker can only modify their own bookings).

    Raises:
        InvalidStateTransitionError: If the transition is illegal (HTTP 409).
        PermissionDeniedError: If the actor is not authorized (HTTP 403).
    """
    # 1. State machine transition validity
    allowed_targets = VALID_TRANSITIONS.get(current_status, set())
    if target_status not in allowed_targets:
        raise InvalidStateTransitionError(
            from_state=current_status,
            to_state=target_status,
            reason=f"Allowed transitions from '{current_status}' are: {', '.join(sorted(allowed_targets)) or 'None (Terminal state)'}.",
        )

    # 2. Permission checks
    allowed_roles = ROLE_TRANSITION_PERMISSIONS.get(target_status, set())

    # Admins and verified resource managers inherit manager privileges
    effective_role = actor_role
    if is_resource_manager and actor_role != "admin":
        effective_role = "manager"

    if effective_role not in allowed_roles:
        raise PermissionDeniedError(
            f"Role '{actor_role}' is not authorized to transition booking to '{target_status}'."
        )

    # 3. Ownership check for regular bookers/users
    if actor_role in ("user", "booker") and actor_id != booking_user_id:
        raise PermissionDeniedError("Users may only perform actions on their own bookings.")
