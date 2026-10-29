from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def check_eligibility(
    user: Optional[Any],
    resource: Any,
    user_credentials: Optional[List[Any]] = None,
) -> Dict[str, Any]:
    """Pure function rule engine for user-resource booking eligibility.

    Evaluates:
    1. Authentication & user active status (suspended users blocked)
    2. Organizational audience rules (org_only, approved_list, anyone_verified)
    3. Resource requirements vs. user credentials (type, unexpired, verified)
    4. Faculty sponsorship / approval requirements

    Returns:
        {
            "eligible": bool,
            "checks": [
                {"requirement": str, "passed": bool, "reason": str}
            ]
        }
    """
    checks: List[Dict[str, Any]] = []

    # 1. User Presence & Status
    if not user:
        return {
            "eligible": False,
            "checks": [
                {
                    "requirement": "Authentication",
                    "passed": False,
                    "reason": "You must be signed in to verify booking eligibility.",
                }
            ],
        }

    user_status = getattr(user, "status", "active")
    if user_status == "suspended":
        return {
            "eligible": False,
            "checks": [
                {
                    "requirement": "Account Standing",
                    "passed": False,
                    "reason": "Account is currently suspended due to safety or policy violation strikes.",
                }
            ],
        }

    # Admin and manager override (exempt from prerequisite checks)
    user_role = getattr(user, "role", "user")
    if user_role in ("admin", "manager"):
        return {
            "eligible": True,
            "checks": [
                {
                    "requirement": "Administrative Clearance",
                    "passed": True,
                    "reason": f"Full system clearance granted under {user_role.upper()} role.",
                }
            ],
        }

    # 2. Audience / Organizational Boundary Rules
    allowed_audience = getattr(resource, "allowed_audience", "anyone_verified")
    resource_org_id = getattr(resource, "org_id", None)
    user_org_id = getattr(user, "org_id", None)

    if allowed_audience == "org_only":
        is_same_org = bool(resource_org_id and user_org_id and resource_org_id == user_org_id)
        checks.append({
            "requirement": "Institutional Membership",
            "passed": is_same_org,
            "reason": "Access granted: Verified member of host organization."
            if is_same_org
            else "Access restricted: Resource is reserved strictly for members of the host institution.",
        })

    # 3. Prerequisites & Credentials
    creds = user_credentials or []
    now = datetime.now(timezone.utc)
    requirements = getattr(resource, "requirements", []) or []

    for req in requirements:
        req_type = getattr(req, "type", "")
        req_name = getattr(req, "name", "")
        required_cred = getattr(req, "required_credential_name", req_name)

        if req_type in ("training", "qualification", "membership", "id"):
            # Find matching credential by name or type
            matching = [
                c for c in creds
                if (c.name.lower() == required_cred.lower() or c.type.lower() == req_type.lower())
            ]

            if not matching:
                checks.append({
                    "requirement": req_name,
                    "passed": False,
                    "reason": f"Missing required certification badge: '{required_cred}'. Submission required.",
                })
            else:
                cred = matching[0]
                status = getattr(cred, "status", "pending")
                expiry = getattr(cred, "expiry_date", None)

                # Ensure timezone-aware comparison
                if expiry and expiry.tzinfo is None:
                    expiry = expiry.replace(tzinfo=timezone.utc)

                if status == "verified" and (not expiry or expiry > now):
                    checks.append({
                        "requirement": req_name,
                        "passed": True,
                        "reason": f"Verified credential: '{cred.name}' is valid and up to date.",
                    })
                elif status == "pending":
                    checks.append({
                        "requirement": req_name,
                        "passed": False,
                        "reason": f"Credential '{cred.name}' is currently pending verification by lab management.",
                    })
                elif status == "rejected":
                    checks.append({
                        "requirement": req_name,
                        "passed": False,
                        "reason": f"Credential '{cred.name}' was rejected: {getattr(cred, 'review_reason', 'Please reapply.')}",
                    })
                elif status == "expired" or (expiry and expiry <= now):
                    checks.append({
                        "requirement": req_name,
                        "passed": False,
                        "reason": f"Credential '{cred.name}' expired on {expiry.strftime('%Y-%m-%d') if expiry else 'unknown'}.",
                    })

        elif req_type == "faculty_approval":
            # Faculty approval rule: students need faculty sponsor approval
            is_faculty = getattr(user, "role", "") in ("faculty", "owner", "admin")
            checks.append({
                "requirement": "Faculty / PI Sign-Off",
                "passed": is_faculty,
                "reason": "Faculty member or PI verified."
                if is_faculty
                else f"Requires departmental sponsor sign-off for {getattr(resource, 'title', 'this resource')}.",
            })

    all_passed = all(c["passed"] for c in checks) if checks else True

    return {
        "eligible": all_passed,
        "checks": checks,
    }
