from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.credential import Credential
from app.models.organization import Organization
from app.models.resource import AvailabilityWindow, Resource, ResourceManager, ResourceRequirement
from app.models.user import User

from sqlalchemy.pool import NullPool

# Shared test database file for isolated integration & concurrency testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_lendspace.db"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=NullPool,
    connect_args={"check_same_thread": False, "timeout": 30.0},
)

from sqlalchemy import event

@event.listens_for(test_engine.sync_engine, "connect")
def _set_test_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA foreign_keys=ON;")
    cursor.execute("PRAGMA busy_timeout=5000;")
    cursor.close()

test_session_maker = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with test_session_maker() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        async with test_session_maker() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def seed_test_data(db_session: AsyncSession):
    org = Organization(name="Test University", type="academic", verified=True)
    db_session.add(org)
    await db_session.flush()

    pw = hash_password("password123")
    user = User(email="testuser@example.com", password_hash=pw, full_name="Test Student", role="user", org_id=org.id)
    owner = User(email="testowner@example.com", password_hash=pw, full_name="Test Owner", role="owner", org_id=org.id)
    manager = User(email="testmgr@example.com", password_hash=pw, full_name="Test Manager", role="manager", org_id=org.id)
    admin = User(email="testadmin@example.com", password_hash=pw, full_name="Test Admin", role="admin", org_id=org.id)

    db_session.add_all([user, owner, manager, admin])
    await db_session.flush()

    # Credential for user
    cred = Credential(
        user_id=user.id,
        type="training",
        name="Laser Safety",
        status="verified",
        expiry_date=datetime.now(timezone.utc) + timedelta(days=90),
    )
    db_session.add(cred)

    # Resource
    res = Resource(
        owner_id=owner.id,
        org_id=org.id,
        kind="equipment",
        title="Test 3D Printer",
        description="Precision prototype printer",
        category="3D Printing",
        location="Lab 101",
        status="live",
        approval_mode="auto",
        max_hours_per_booking=4,
        max_hours_per_week_per_user=12,
        buffer_minutes=15,
        allowed_audience="anyone_verified",
        waitlist_enabled=True,
    )
    res.availability_windows.append(AvailabilityWindow(weekday=0, start_time="08:00", end_time="20:00"))
    res.availability_windows.append(AvailabilityWindow(weekday=1, start_time="08:00", end_time="20:00"))
    res.availability_windows.append(AvailabilityWindow(weekday=2, start_time="08:00", end_time="20:00"))
    res.availability_windows.append(AvailabilityWindow(weekday=3, start_time="08:00", end_time="20:00"))
    res.availability_windows.append(AvailabilityWindow(weekday=4, start_time="08:00", end_time="20:00"))
    res.availability_windows.append(AvailabilityWindow(weekday=5, start_time="08:00", end_time="20:00"))
    res.availability_windows.append(AvailabilityWindow(weekday=6, start_time="08:00", end_time="20:00"))

    db_session.add(res)
    await db_session.commit()

    return {
        "org": org,
        "user": user,
        "owner": owner,
        "manager": manager,
        "admin": admin,
        "resource": res,
    }


def auth_headers(user_id: str, role: str, org_id: str = None) -> dict:
    token = create_access_token(subject=user_id, role=role, org_id=org_id)
    return {"Authorization": f"Bearer {token}"}
