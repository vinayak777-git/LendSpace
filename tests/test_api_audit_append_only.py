import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditEvent
from tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_audit_log_query_endpoint(client: AsyncClient, seed_test_data):
    admin = seed_test_data["admin"]
    headers = auth_headers(admin.id, "admin", str(admin.org_id))

    resp = await client.get("/api/v1/audit/", headers=headers)
    assert resp.status_code == 200
    events = resp.json()
    assert isinstance(events, list)


@pytest.mark.asyncio
async def test_audit_event_is_strictly_append_only(db_session: AsyncSession):
    # 1. Insert audit event
    event = AuditEvent(
        actor_id="test-actor",
        actor_role="admin",
        action="TEST_LOG",
        entity_type="test",
        entity_id="test-1",
        reason="Testing append-only compliance",
    )
    db_session.add(event)
    await db_session.commit()

    # 2. Query event
    stmt = select(AuditEvent).where(AuditEvent.id == event.id)
    saved = (await db_session.execute(stmt)).scalar_one()
    assert saved.action == "TEST_LOG"

    # 3. Attempt UPDATE -> MUST RAISE RuntimeError
    with pytest.raises(RuntimeError) as exc_update:
        saved.reason = "Tampered reason"
        await db_session.commit()
    assert "append-only" in str(exc_update.value)

    await db_session.rollback()

    # 4. Attempt DELETE -> MUST RAISE RuntimeError
    with pytest.raises(RuntimeError) as exc_delete:
        await db_session.delete(saved)
        await db_session.commit()
    assert "append-only" in str(exc_delete.value)
