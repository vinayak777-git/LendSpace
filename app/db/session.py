from typing import AsyncGenerator, Optional
from fastapi import Request
from sqlalchemy import event
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from app.core.config import settings


def _create_engine(url: str):
    kwargs = {}
    if url.startswith("sqlite"):
        kwargs["connect_args"] = {
            "check_same_thread": False,
            "timeout": 30.0,
        }
    else:
        kwargs["pool_pre_ping"] = True
        kwargs["pool_recycle"] = 300
        kwargs["pool_size"] = 10
        kwargs["max_overflow"] = 20

    engine = create_async_engine(
        url,
        echo=settings.DEBUG,
        future=True,
        **kwargs,
    )

    if url.startswith("sqlite"):
        @event.listens_for(engine.sync_engine, "connect")
        def _set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL;")
            cursor.execute("PRAGMA foreign_keys=ON;")
            cursor.execute("PRAGMA busy_timeout=5000;")
            cursor.close()

    return engine


# Single Unified Engine & Session Maker
async_engine = _create_engine(settings.DATABASE_URL)
async_session_maker = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Aliases for backward compatibility
booker_engine = async_engine
owner_engine = async_engine
booker_session_maker = async_session_maker
owner_session_maker = async_session_maker


def get_session_maker_for_role(role: Optional[str] = None) -> async_sessionmaker[AsyncSession]:
    """Single unified session maker for all roles."""
    return async_session_maker


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Unified single-database dependency yielding an AsyncSession with auto commit/rollback."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# Explicit aliases for any endpoint dependencies
get_booker_db = get_db
get_owner_db = get_db
