import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"


@pytest.mark.asyncio
async def test_booker_registration_and_profile(client: AsyncClient, db_session: AsyncSession):
    # 1. Register new Booker
    reg_resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "realbooker@university.edu",
            "password": "StrongPassword999!",
            "full_name": "Jordan Booker",
            "phone": "+1-555-0199",
            "role": "booker",
        },
    )
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    user_info = data["user"]
    assert user_info["email"] == "realbooker@university.edu"
    assert user_info["role"] == "booker"
    assert user_info["full_name"] == "Jordan Booker"
    assert "password" not in user_info
    assert "password_hash" not in user_info

    # Verify password in database is hashed with Argon2
    stmt = select(User).where(User.email == "realbooker@university.edu")
    res = await db_session.execute(stmt)
    db_user = res.scalar_one()
    assert db_user.password_hash != "StrongPassword999!"
    assert "$argon2" in db_user.password_hash

    # 2. Access /api/v1/auth/me with Bearer token
    me_resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {data['access_token']}"},
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["id"] == db_user.id


@pytest.mark.asyncio
async def test_owner_registration_and_profile(client: AsyncClient):
    # Register new Owner
    reg_resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "labdirector@university.edu",
            "password": "StrongOwnerPassword888!",
            "full_name": "Dr. Morgan Vance",
            "business_name": "Robotics & Rapid Prototyping Center",
            "phone": "+1-555-0288",
            "role": "owner",
        },
    )
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert data["user"]["role"] == "owner"
    assert data["user"]["business_name"] == "Robotics & Rapid Prototyping Center"


@pytest.mark.asyncio
async def test_duplicate_registration_rejected(client: AsyncClient):
    payload = {
        "email": "duplicate@university.edu",
        "password": "SecurePassword123!",
        "full_name": "Duplicate Tester",
        "role": "booker",
    }
    first_resp = await client.post("/api/v1/auth/register", json=payload)
    assert first_resp.status_code == 201

    # Second registration with identical email must be rejected with 409
    dup_resp = await client.post("/api/v1/auth/register", json=payload)
    assert dup_resp.status_code == 409
    assert "already exists" in dup_resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_invalid_input_rejected_on_server(client: AsyncClient):
    # Password too short (<8 chars)
    short_pw = await client.post(
        "/api/v1/auth/register",
        json={"email": "valid@test.edu", "password": "short", "full_name": "Valid Name", "role": "booker"},
    )
    assert short_pw.status_code == 422

    # Malformed email
    bad_email = await client.post(
        "/api/v1/auth/register",
        json={"email": "not-an-email", "password": "Password123!", "full_name": "Valid Name", "role": "booker"},
    )
    assert bad_email.status_code == 422

    # Attempting to assign administrative role via public registration
    admin_attempt = await client.post(
        "/api/v1/auth/register",
        json={"email": "adminattempt@test.edu", "password": "Password123!", "full_name": "Hacker", "role": "admin"},
    )
    assert admin_attempt.status_code == 422


@pytest.mark.asyncio
async def test_authentication_with_wrong_password_fails(client: AsyncClient):
    # Register valid account
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "registered@university.edu",
            "password": "CorrectPassword123!",
            "full_name": "Registered Student",
            "role": "booker",
        },
    )

    # Attempt login with incorrect password
    bad_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "registered@university.edu", "password": "WrongPassword123!"},
    )
    assert bad_login.status_code == 401
    assert bad_login.json()["detail"] == "Invalid email or password."

    # Attempt login with non-existent email
    no_user = await client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@university.edu", "password": "SomePassword123!"},
    )
    assert no_user.status_code == 401
    # Generic error message: no email leakage
    assert no_user.json()["detail"] == "Invalid email or password."


@pytest.mark.asyncio
async def test_logout_endpoint(client: AsyncClient):
    # Register and login
    login_resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "logoutuser@university.edu",
            "password": "Password123!",
            "full_name": "Logout User",
            "role": "booker",
        },
    )
    token = login_resp.json()["access_token"]

    # Call logout
    logout_resp = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert logout_resp.status_code == 200
    assert "logged out" in logout_resp.json()["message"].lower()


@pytest.mark.asyncio
async def test_booker_cannot_create_resources(client: AsyncClient):
    # Booker registers
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "studentbooker@university.edu",
            "password": "Password123!",
            "full_name": "Student Booker",
            "role": "booker",
        },
    )
    booker_token = reg.json()["access_token"]

    # Booker tries to access Owner-only POST /api/v1/resources/
    create_attempt = await client.post(
        "/api/v1/resources/",
        headers={"Authorization": f"Bearer {booker_token}"},
        json={
            "title": "Unauthorized 3D Printer",
            "description": "Booker attempting to create resource",
            "kind": "equipment",
            "category": "3D Printing",
            "location": "Room 101",
            "status": "live",
            "approval_mode": "auto",
            "max_hours_per_booking": 2,
            "max_hours_per_week_per_user": 4,
            "buffer_minutes": 15,
            "requirements": [],
            "availability_windows": [],
            "blackout_dates": [],
            "managers": [],
        },
    )
    assert create_attempt.status_code == 403


@pytest.mark.asyncio
async def test_owner_cannot_modify_other_owner_resource(client: AsyncClient):
    # 1. Owner A registers and creates a resource
    reg_a = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "owner_a@university.edu",
            "password": "OwnerPasswordA123!",
            "full_name": "Owner Alice",
            "role": "owner",
        },
    )
    token_a = reg_a.json()["access_token"]

    res_resp = await client.post(
        "/api/v1/resources/",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "title": "Alice's CNC Machine",
            "description": "Owner A's private machine",
            "kind": "equipment",
            "category": "Machining",
            "location": "Bay 1",
            "status": "live",
            "approval_mode": "manual",
            "max_hours_per_booking": 3,
            "max_hours_per_week_per_user": 6,
            "buffer_minutes": 15,
            "requirements": [],
            "availability_windows": [],
            "blackout_dates": [],
            "managers": [],
        },
    )
    assert res_resp.status_code == 201
    resource_id = res_resp.json()["id"]

    # 2. Owner B registers
    reg_b = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "owner_b@university.edu",
            "password": "OwnerPasswordB123!",
            "full_name": "Owner Bob",
            "role": "owner",
        },
    )
    token_b = reg_b.json()["access_token"]

    # 3. Owner B attempts to patch Alice's resource -> 403 Forbidden!
    patch_attempt = await client.patch(
        f"/api/v1/resources/{resource_id}",
        headers={"Authorization": f"Bearer {token_b}"},
        json={"title": "Hacked Title"},
    )
    assert patch_attempt.status_code == 403
