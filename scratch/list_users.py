import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def list_users():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT id, email, role, full_name, status, created_at FROM users;"))
        rows = res.fetchall()
        print(f"Total users in current database ({len(rows)}):")
        for r in rows:
            print(" ", r)
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(list_users())

