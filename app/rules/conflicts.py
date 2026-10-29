from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional


def check_conflicts(
    resource: Any,
    requested_start: datetime,
    requested_end: datetime,
    existing_bookings: List[Any],
    blackout_dates: Optional[List[Any]] = None,
    buffer_minutes: Optional[int] = None,
    exclude_booking_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Pure function rule engine for booking conflict detection and alternative slot generation.

    Validates:
    - Chronological order (start < end)
    - Resource max single session duration
    - Max advance booking window
    - Resource availability windows (operating hours per weekday)
    - Blackout dates (closures / maintenance)
    - Buffer minutes separation
    - Overlap with blocking bookings (approved, checked_in, overdue)

    Returns:
        {
            "has_conflict": bool,
            "reasons": List[str],
            "suggested_slots": List[Dict[str, str]]
        }
    """
    reasons: List[str] = []
    now = datetime.now(timezone.utc)

    # Ensure tz-aware
    if requested_start.tzinfo is None:
        requested_start = requested_start.replace(tzinfo=timezone.utc)
    if requested_end.tzinfo is None:
        requested_end = requested_end.replace(tzinfo=timezone.utc)

    # 1. Basic Chronology
    if requested_end <= requested_start:
        return {
            "has_conflict": True,
            "reasons": ["Reservation end time must be strictly after the start time."],
            "suggested_slots": [],
        }

    duration_hours = (requested_end - requested_start).total_seconds() / 3600.0

    # 2. Max Session Duration
    max_hours = getattr(resource, "max_hours_per_booking", 4) or 4
    if duration_hours > max_hours:
        reasons.append(
            f"Exceeds max allowed duration: Session is {duration_hours:.1f}h (maximum allowed is {max_hours}h)."
        )

    # 3. Max Advance Days
    max_advance = getattr(resource, "max_advance_days", 14) or 14
    furthest_allowed = now + timedelta(days=max_advance)
    if requested_start > furthest_allowed:
        reasons.append(
            f"Booking too far in advance: Reservations are restricted to at most {max_advance} days ahead."
        )

    # 4. Availability Windows (Operational Hours)
    # Python weekday: 0 = Monday, 6 = Sunday
    req_weekday = requested_start.weekday()
    windows = getattr(resource, "availability_windows", []) or []

    if windows:
        # Check if there is an availability window for this weekday
        day_windows = [w for w in windows if w.weekday == req_weekday]
        if not day_windows:
            reasons.append(f"Resource is closed on {requested_start.strftime('%A')}s.")
        else:
            req_start_time_str = requested_start.strftime("%H:%M")
            req_end_time_str = requested_end.strftime("%H:%M")

            # Check if reservation falls entirely within at least one window
            fits_window = any(
                w.start_time <= req_start_time_str and req_end_time_str <= w.end_time
                for w in day_windows
            )
            if not fits_window:
                avail_summary = ", ".join(f"{w.start_time} - {w.end_time}" for w in day_windows)
                reasons.append(
                    f"Requested slot ({req_start_time_str} - {req_end_time_str}) is outside operating hours ({avail_summary})."
                )

    # 5. Blackout Dates
    blackouts = blackout_dates or getattr(resource, "blackout_dates", []) or []
    for bo in blackouts:
        bo_start = bo.start_at
        bo_end = bo.end_at
        if bo_start.tzinfo is None:
            bo_start = bo_start.replace(tzinfo=timezone.utc)
        if bo_end.tzinfo is None:
            bo_end = bo_end.replace(tzinfo=timezone.utc)

        # Overlap check
        if requested_start < bo_end and requested_end > bo_start:
            reasons.append(f"Slot coincides with blackout closure: {getattr(bo, 'reason', 'Facility maintenance')}.")
            break

    # 6. Overlapping Bookings & Buffer Separation
    buffer_mins = buffer_minutes if buffer_minutes is not None else getattr(resource, "buffer_minutes", 15) or 0
    buffer_delta = timedelta(minutes=buffer_mins)

    effective_start = requested_start - buffer_delta
    effective_end = requested_end + buffer_delta

    blocking_statuses = {"approved", "checked_in", "overdue"}
    conflicting_bookings = []

    for b in existing_bookings:
        if exclude_booking_id and str(b.id) == str(exclude_booking_id):
            continue
        if getattr(b, "status", "") not in blocking_statuses:
            continue

        b_start = b.start_at
        b_end = b.end_at
        if b_start.tzinfo is None:
            b_start = b_start.replace(tzinfo=timezone.utc)
        if b_end.tzinfo is None:
            b_end = b_end.replace(tzinfo=timezone.utc)

        # Buffer-aware overlap
        if effective_start < b_end and effective_end > b_start:
            conflicting_bookings.append(b)
            b_time_str = f"{b_start.strftime('%b %d, %H:%M')} - {b_end.strftime('%H:%M')}"
            reasons.append(
                f"Requested time conflicts with an existing reservation ({b_time_str}) including mandatory {buffer_mins}m buffer."
            )

    has_conflict = len(reasons) > 0

    # 7. Generate Alternative Slots (up to 3 suggestions)
    suggested_slots: List[Dict[str, str]] = []
    if has_conflict:
        duration = requested_end - requested_start
        candidate_offsets = [2, 4, 24, 26, 48]  # candidate offsets in hours

        for offset in candidate_offsets:
            if len(suggested_slots) >= 3:
                break

            cand_start = requested_start + timedelta(hours=offset)
            cand_end = cand_start + duration

            # Round to clean 30-min block
            cand_start = cand_start.replace(minute=0 if cand_start.minute < 30 else 30, second=0, microsecond=0)
            cand_end = cand_start + duration

            # Quick check if candidate conflicts with configured operational windows
            if windows:
                cand_day_windows = [w for w in windows if w.weekday == cand_start.weekday()]
                if not cand_day_windows:
                    continue

                c_start_str = cand_start.strftime("%H:%M")
                c_end_str = cand_end.strftime("%H:%M")
                if not any(w.start_time <= c_start_str and c_end_str <= w.end_time for w in cand_day_windows):
                    continue

            # Check overlap with existing bookings
            overlaps = False
            for b in existing_bookings:
                if getattr(b, "status", "") not in blocking_statuses:
                    continue
                b_start = b.start_at.replace(tzinfo=timezone.utc) if b.start_at.tzinfo is None else b.start_at
                b_end = b.end_at.replace(tzinfo=timezone.utc) if b.end_at.tzinfo is None else b.end_at
                if (cand_start - buffer_delta) < b_end and (cand_end + buffer_delta) > b_start:
                    overlaps = True
                    break

            if not overlaps:
                suggested_slots.append({
                    "start": cand_start.isoformat(),
                    "end": cand_end.isoformat(),
                    "label": f"{cand_start.strftime('%a, %b %d at %H:%M')} - {cand_end.strftime('%H:%M')}",
                })

    return {
        "has_conflict": has_conflict,
        "reasons": reasons,
        "suggested_slots": suggested_slots,
    }
