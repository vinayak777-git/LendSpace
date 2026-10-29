from app.rules.fairness import calculate_priority_score, check_fairness, rank_waitlist_entries


def test_priority_score_calculation():
    # Academic capstone with safety badge
    score, breakdown = calculate_priority_score(
        purpose="Senior Engineering Capstone Project",
        is_academic=True,
        has_safety_badge=True,
        hours_used_this_week=0.0,
        waiting_hours=2.0,
        strikes_count=0,
    )
    # base 50 + 20 capstone + 15 academic + 10 badge + 6 wait = 100 maxed at 100
    assert score == 100
    assert breakdown["purpose_boost"] == 20
    assert breakdown["badge_bonus"] == 10


def test_heavy_usage_penalizes_score():
    score, breakdown = calculate_priority_score(
        purpose="Casual hobby print",
        is_academic=False,
        has_safety_badge=False,
        hours_used_this_week=10.0,
        waiting_hours=0.0,
        strikes_count=0,
    )
    # base 50 - 40 usage penalty = 10
    assert score == 10
    assert breakdown["usage_penalty"] == 40


def test_weekly_cap_check_fairness():
    from unittest.mock import MagicMock
    resource = MagicMock(max_hours_per_week_per_user=10.0, cooldown_hours=0)
    user = MagicMock()
    res = check_fairness(
        resource=resource,
        user=user,
        requested_hours=3.0,
        hours_used_this_week=8.0,
    )
    assert res["passed"] is False
    assert any("Exceeds weekly quota" in r for r in res["reasons"])


def test_rank_waitlist_entries():
    entries = [
        {"id": "entry-low", "priority_score": 30, "created_at": 100},
        {"id": "entry-high", "priority_score": 85, "created_at": 105},
        {"id": "entry-mid", "priority_score": 50, "created_at": 90},
    ]
    ranked = rank_waitlist_entries(entries)
    assert ranked[0]["id"] == "entry-high"
    assert ranked[1]["id"] == "entry-mid"
    assert ranked[2]["id"] == "entry-low"
