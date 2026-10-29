from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock
from app.rules.eligibility import check_eligibility


def test_suspended_user_ineligible():
    user = MagicMock(status="suspended", role="user", org_id="org1")
    resource = MagicMock(allowed_audience="anyone_verified", requirements=[])

    res = check_eligibility(user, resource)
    assert res["eligible"] is False
    assert any("suspended" in c["reason"] for c in res["checks"])


def test_missing_credentials_ineligible():
    user = MagicMock(status="active", role="user", org_id="org1")
    req = MagicMock(type="training", name="Laser Safety", required_credential_name="Laser Safety")
    resource = MagicMock(allowed_audience="anyone_verified", requirements=[req])

    # User has no credentials
    res = check_eligibility(user, resource, user_credentials=[])
    assert res["eligible"] is False
    assert any("Missing required" in c["reason"] for c in res["checks"])


def test_expired_credential_ineligible():
    user = MagicMock(status="active", role="user", org_id="org1")
    req = MagicMock(type="training", name="Laser Safety", required_credential_name="Laser Safety")
    resource = MagicMock(allowed_audience="anyone_verified", requirements=[req])

    # Expired credential
    cred = MagicMock(
        name="Laser Safety",
        type="training",
        status="verified",
        expiry_date=datetime.now(timezone.utc) - timedelta(days=1),
    )
    res = check_eligibility(user, resource, user_credentials=[cred])
    assert res["eligible"] is False
    assert any("expired" in c["reason"] for c in res["checks"])


def test_valid_credential_eligible():
    user = MagicMock(status="active", role="user", org_id="org1")
    req = MagicMock(type="training", name="Laser Safety", required_credential_name="Laser Safety")
    resource = MagicMock(allowed_audience="anyone_verified", requirements=[req])

    cred = MagicMock(
        name="Laser Safety",
        type="training",
        status="verified",
        expiry_date=datetime.now(timezone.utc) + timedelta(days=30),
    )
    res = check_eligibility(user, resource, user_credentials=[cred])
    assert res["eligible"] is True
    assert all(c["passed"] for c in res["checks"])


def test_admin_role_bypass():
    user = MagicMock(status="active", role="admin", org_id="org1")
    req = MagicMock(type="training", name="Advanced Laser", required_credential_name="Advanced Laser")
    resource = MagicMock(allowed_audience="anyone_verified", requirements=[req])

    res = check_eligibility(user, resource, user_credentials=[])
    assert res["eligible"] is True
