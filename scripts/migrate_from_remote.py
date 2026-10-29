"""One-time optional data migration script to copy existing users and resources
from previous remote databases into the single unified local database.
"""
import asyncio
import os
import sys
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.base import Base
from app.db.session import async_engine


async def migrate_data(remote_booker_url: str = None, remote_owner_url: str = None):
    print("Initializing unified database tables...")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    if not remote_booker_url and not remote_owner_url:
        print("No remote URLs provided. Unified database schema is ready.")
        return

    # Migrate from remote if URLs provided
    for source_name, url in [("Booker DB", remote_booker_url), ("Owner DB", remote_owner_url)]:
        if not url:
            continue
        try:
            print(f"Checking connection to {source_name}...")
            engine = create_async_engine(url)
            async with engine.connect() as conn:
                res = await conn.execute(text("SELECT email, password_hash, full_name, phone, role, status FROM users;"))
                users = res.fetchall()
                print(f"Found {len(users)} users in {source_name}.")
                async with async_engine.begin() as local_conn:
                    for u in users:
                        await local_conn.execute(
                            text(
                                "INSERT OR IGNORE INTO users (id, email, password_hash, full_name, phone, role, status, email_verified, privacy_settings, created_at, updated_at) "
                                "VALUES (lower(hex(randomblob(16))), :email, :password_hash, :full_name, :phone, :role, :status, 0, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);"
                            ),
                            {
                                "email": u[0],
                                "password_hash": u[1],
                                "full_name": u[2],
                                "phone": u[3],
                                "role": u[4],
                                "status": u[5],
                            },
                        )
            await engine.dispose()
            print(f"Successfully migrated records from {source_name}.")
        except Exception as e:
            print(f"Could not migrate from {source_name}: {e}")


if __name__ == "__main__":
    b_url = os.environ.get("REMOTE_BOOKER_DB_URL")
    o_url = os.environ.get("REMOTE_OWNER_DB_URL")
    asyncio.run(migrate_data(b_url, o_url))

