import pytest
from app.core.errors import InvalidStateTransitionError, PermissionDeniedError
from app.rules.state_machine import validate_booking_transition


def test_valid_approval_by_owner():
    # pending -> approved by owner should pass
    validate_booking_transition(
        current_status="pending",
        target_status="approved",
        actor_role="owner",
        actor_id="owner-1",
        booking_user_id="user-1",
    )


def test_invalid_transition_raises_409():
    # pending -> returned is illegal
    with pytest.raises(InvalidStateTransitionError) as exc_info:
        validate_booking_transition(
            current_status="pending",
            target_status="returned",
            actor_role="admin",
            actor_id="admin-1",
            booking_user_id="user-1",
        )
    assert exc_info.value.status_code == 409
    assert exc_info.value.code == "INVALID_STATE_TRANSITION"


def test_unauthorized_role_raises_403():
    # Regular user cannot approve their own booking
    with pytest.raises(PermissionDeniedError) as exc_info:
        validate_booking_transition(
            current_status="pending",
            target_status="approved",
            actor_role="user",
            actor_id="user-1",
            booking_user_id="user-1",
        )
    assert exc_info.value.status_code == 403


def test_user_can_cancel_own_booking():
    # pending -> cancelled by booking owner should pass
    validate_booking_transition(
        current_status="pending",
        target_status="cancelled",
        actor_role="user",
        actor_id="user-1",
        booking_user_id="user-1",
    )


def test_user_cannot_cancel_others_booking():
    with pytest.raises(PermissionDeniedError):
        validate_booking_transition(
            current_status="pending",
            target_status="cancelled",
            actor_role="user",
            actor_id="stranger-1",
            booking_user_id="user-1",
        )
