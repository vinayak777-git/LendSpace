from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple


def calculate_priority_score(
    purpose: str = "",
    is_academic: bool = False,
    has_safety_badge: bool = False,
    hours_used_this_week: float = 0.0,
    waiting_hours: float = 0.0,
    strikes_count: int = 0,
) -> Tuple[int, Dict[str, Any]]:
    """Calculate the anti-monopolization priority score (range 5 - 100).

    Base Score: 50 pts
    + Purpose Weight (Capstone: +20, Coursework: +10, Competition: +5)
    + Academic Boost (+15 pts if accredited research or capstone)
    + Safety Badge Bonus (+10 pts)
    + Waiting Time Boost (+3 pts/hr in queue, max 30 pts)
    - Usage Penalty (-4 pts per hour booked this calendar week)
    - Strike Penalty (-15 pts per late return or safety strike)
    """
    base_score = 50
    p_lower = (purpose or "").lower()

    # 1. Purpose Weight
    purpose_boost = 0
    if any(k in p_lower for k in ("capstone", "thesis", "dissertation")):
        purpose_boost = 20
    elif any(k in p_lower for k in ("coursework", "assignment", "lab project", "curriculum")):
        purpose_boost = 10
    elif any(k in p_lower for k in ("competition", "hackathon", "robotics", "rover")):
        purpose_boost = 5

    # 2. Academic Boost
    academic_boost = 15 if is_academic or purpose_boost == 20 else 0

    # 3. Badge Bonus
    badge_bonus = 10 if has_safety_badge else 0

    # 4. Waiting Boost (max 30)
    waiting_boost = min(30, int(waiting_hours * 3))

    # 5. Usage Penalty
    usage_penalty = int(hours_used_this_week * 4)

    # 6. Strike Penalty
    strike_penalty = strikes_count * 15

    total = base_score + purpose_boost + academic_boost + badge_bonus + waiting_boost - usage_penalty - strike_penalty
    final_score = max(5, min(100, total))

    breakdown = {
        "base_score": base_score,
        "purpose_boost": purpose_boost,
        "academic_boost": academic_boost,
        "badge_bonus": badge_bonus,
        "waiting_boost": waiting_boost,
        "usage_penalty": usage_penalty,
        "strike_penalty": strike_penalty,
        "total": final_score,
    }

    return final_score, breakdown


def check_fairness(
    resource: Any,
    user: Any,
    requested_hours: float,
    hours_used_this_week: float,
    user_recent_bookings: Optional[List[Any]] = None,
    requested_start: Optional[datetime] = None,
) -> Dict[str, Any]:
    """Pure function rule engine for quota verification, cooldowns, and anti-monopolization.

    Returns:
        {
            "passed": bool,
            "reasons": List[str]
        }
    """
    reasons: List[str] = []

    # 1. Weekly Hour Cap
    weekly_cap = getattr(resource, "max_hours_per_week_per_user", 12) or 12
    if (hours_used_this_week + requested_hours) > weekly_cap:
        reasons.append(
            f"Exceeds weekly quota: You have used {hours_used_this_week:.1f}h of your {weekly_cap}h weekly limit for this resource."
        )

    # 2. Cooldown Window Check
    cooldown_hours = getattr(resource, "cooldown_hours", 0) or 0
    if cooldown_hours > 0 and user_recent_bookings and requested_start:
        if requested_start.tzinfo is None:
            requested_start = requested_start.replace(tzinfo=timezone.utc)

        cooldown_delta = timedelta(hours=cooldown_hours)
        for b in user_recent_bookings:
            if getattr(b, "status", "") in ("approved", "checked_in", "returned"):
                b_end = b.end_at
                if b_end.tzinfo is None:
                    b_end = b_end.replace(tzinfo=timezone.utc)

                time_since_last = requested_start - b_end
                if timedelta(seconds=0) <= time_since_last < cooldown_delta:
                    remaining_cooldown = cooldown_delta - time_since_last
                    hours_rem = int(remaining_cooldown.total_seconds() / 3600)
                    reasons.append(
                        f"Cooldown active: Mandatory {cooldown_hours}h spacing required between reservations ({hours_rem}h remaining)."
                    )
                    break

    # 3. Max Active Pending Requests
    if user_recent_bookings:
        active_pending = [
            b for b in user_recent_bookings
            if getattr(b, "status", "") in ("pending", "waitlisted")
        ]
        max_pending = 1 if getattr(resource, "demand_level", "medium") == "high" else 2
        if len(active_pending) >= max_pending:
            reasons.append(
                f"Pending limit reached: You already have {len(active_pending)} active pending/waitlisted request(s) for this facility."
            )

    return {
        "passed": len(reasons) == 0,
        "reasons": reasons,
    }


def rank_waitlist_entries(entries: List[Any]) -> List[Any]:
    """Sort waitlist queue entries by priority score descending, then by creation time ascending."""
    def get_score(e: Any) -> int:
        return e.get("priority_score", 0) if isinstance(e, dict) else getattr(e, "priority_score", 0)

    def get_created(e: Any) -> Any:
        return e.get("created_at", datetime.min) if isinstance(e, dict) else getattr(e, "created_at", datetime.min)

    return sorted(entries, key=lambda e: (-get_score(e), get_created(e)))
