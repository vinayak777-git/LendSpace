import asyncio
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_current_user
from app.core.security import decode_token
from app.db.session import async_session_maker, get_db
from app.models.user import User
from app.schemas.notification import NotificationRead
from app.services.notification_service import NotificationService
from app.services.outbox_service import OutboxService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get(
    "/",
    response_model=List[NotificationRead],
    summary="List notifications for the current authenticated user",
)
async def list_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> List[NotificationRead]:
    notification_service = NotificationService(session)
    notifs = await notification_service.list_notifications(
        user_id=current_user.id, unread_only=unread_only, limit=limit
    )
    return [NotificationRead.model_validate(n) for n in notifs]


@router.get(
    "/stream",
    summary="Live notification delivery via Server-Sent Events (SSE) with 15s polling fallback",
)
async def notification_stream(
    request: Request,
    token: Optional[str] = Query(None),
    single_tick: bool = Query(False, description="Yield initial tick and close stream (for testing/diagnostics)"),
):
    # Resolve user from Bearer header or query token
    auth_header = request.headers.get("authorization", "")
    token_str = token or (auth_header[7:].strip() if auth_header.lower().startswith("bearer ") else None)

    user_id = None
    if token_str:
        try:
            payload = decode_token(token_str)
            user_id = payload.get("sub")
        except Exception:
            user_id = None

    async def event_generator():
        # Yield initial heartbeat
        yield f"event: connected\ndata: {json.dumps({'status': 'connected', 'user_id': user_id})}\n\n"
        if single_tick:
            return

        while True:
            if await request.is_disconnected():
                break

            if user_id:
                async with async_session_maker() as session:
                    notif_service = NotificationService(session)
                    unread = await notif_service.list_notifications(user_id=user_id, unread_only=True, limit=5)
                    payload = {
                        "unread_count": len(unread),
                        "latest": [
                            {"id": n.id, "title": n.title, "body": n.body, "created_at": n.created_at.isoformat()}
                            for n in unread
                        ],
                    }
                    yield f"event: notification\ndata: {json.dumps(payload)}\n\n"

            # 15s interval between event ticks
            await asyncio.sleep(15)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.patch(
    "/{notification_id}/read",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Mark a specific notification as read",
)
async def mark_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    notification_service = NotificationService(session)
    await notification_service.mark_read(notification_id, user_id=current_user.id)


@router.post(
    "/mark-all-read",
    summary="Mark all unread notifications as read",
)
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> dict:
    notification_service = NotificationService(session)
    count = await notification_service.mark_all_read(user_id=current_user.id)
    return {"marked_read_count": count}


@router.get(
    "/outbox",
    summary="In-app local mail outbox log for verified email delivery",
)
async def list_outbox_emails(
    limit: int = Query(50, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
) -> List[dict]:
    outbox_service = OutboxService(session)
    emails = await outbox_service.list_outbox_emails(limit=limit)
    return [
        {
            "id": e.id,
            "to_email": e.to_email,
            "subject": e.subject,
            "body": e.body,
            "status": e.status,
            "error_message": e.error_message,
            "sent_at": e.sent_at.isoformat() if e.sent_at else None,
            "created_at": e.created_at.isoformat(),
        }
        for e in emails
    ]
