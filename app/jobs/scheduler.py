import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.jobs.auto_completer import autocomplete_finished_bookings_and_settle
from app.jobs.overdue_detector import detect_overdue_bookings
from app.jobs.reminders import send_upcoming_booking_reminders
from app.jobs.stale_booking_cleaner import expire_stale_bookings_and_release_holds
from app.jobs.waitlist_expiry import expire_stale_waitlist_entries

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


def start_scheduler() -> AsyncIOScheduler:
    """Register cron/interval background tasks and start the scheduler."""
    if not scheduler.running:
        # Scan for overdue bookings every 2 minutes
        scheduler.add_job(
            detect_overdue_bookings,
            trigger=IntervalTrigger(minutes=2),
            id="job_detect_overdue",
            name="Scan and transition overdue bookings",
            replace_existing=True,
        )

        # Expire stale pending bookings & release holds every 3 minutes
        scheduler.add_job(
            expire_stale_bookings_and_release_holds,
            trigger=IntervalTrigger(minutes=3),
            id="job_expire_stale",
            name="Expire stale unconfirmed bookings and refund escrow holds",
            replace_existing=True,
        )

        # Expire stale waitlist entries every 5 minutes
        scheduler.add_job(
            expire_stale_waitlist_entries,
            trigger=IntervalTrigger(minutes=5),
            id="job_expire_waitlist",
            name="Expire outdated waitlist entries",
            replace_existing=True,
        )

        # Send booking reminders every 10 minutes
        scheduler.add_job(
            send_upcoming_booking_reminders,
            trigger=IntervalTrigger(minutes=10),
            id="job_send_reminders",
            name="Send reminders for upcoming reservations",
            replace_existing=True,
        )

        # Auto-complete finished bookings and settle escrow every 15 minutes
        scheduler.add_job(
            autocomplete_finished_bookings_and_settle,
            trigger=IntervalTrigger(minutes=15),
            id="job_autocomplete",
            name="Auto-complete elapsed bookings and settle escrow",
            replace_existing=True,
        )

        scheduler.start()
        logger.info("APScheduler initialized with all 5 background jobs running.")

    return scheduler


def stop_scheduler() -> None:
    """Gracefully terminate background scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler shut down gracefully.")
