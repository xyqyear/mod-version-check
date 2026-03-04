import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import settings
from app.services.sync_service import sync_all_mods

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


def start_scheduler() -> None:
    global _scheduler
    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        sync_all_mods,
        trigger=IntervalTrigger(minutes=settings.sync_interval_minutes),
        id="sync_all_mods",
        name="Sync mod versions from providers",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Scheduler started (interval: %d minutes)", settings.sync_interval_minutes)


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Scheduler stopped")
