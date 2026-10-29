from datetime import datetime, timezone
from email.message import EmailMessage
import logging
from pathlib import Path
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.outbox import EmailOutbox

logger = logging.getLogger(__name__)


class OutboxService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.outbox_dir = Path(settings.OUTBOX_DIR)
        self.outbox_dir.mkdir(parents=True, exist_ok=True)

    async def enqueue_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        user_id: Optional[str] = None,
    ) -> EmailOutbox:
        """Saves email record to email_outbox table and creates local .eml file in ./outbox."""
        entry = EmailOutbox(
            user_id=user_id,
            to_email=to_email,
            subject=subject,
            body=body,
            status="pending",
        )
        self.session.add(entry)
        await self.session.flush()

        # Write RFC 822 standard .eml file to local outbox
        try:
            msg = EmailMessage()
            msg["Subject"] = subject
            msg["From"] = "notifications@lendspace.local"
            msg["To"] = to_email
            msg["Date"] = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
            msg.set_content(body)

            safe_ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            eml_path = self.outbox_dir / f"{safe_ts}_{entry.id[:8]}.eml"
            with open(eml_path, "wb") as f:
                f.write(msg.as_bytes())

            logger.info(f"Local notification email written to {eml_path}")
            entry.status = "sent"
            entry.sent_at = datetime.now(timezone.utc)
        except Exception as e:
            logger.warning(f"Could not write local .eml file: {e}")
            entry.status = "failed"
            entry.error_message = str(e)

        return entry

    async def list_outbox_emails(self, limit: int = 50) -> List[EmailOutbox]:
        stmt = select(EmailOutbox).order_by(EmailOutbox.created_at.desc()).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

