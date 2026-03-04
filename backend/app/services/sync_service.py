import asyncio
import logging
from datetime import datetime

from app.db import async_session
from app.models import SyncStatus
from app.providers import get_all_providers
from app.repositories.mod_repository import ModRepository
from app.repositories.mod_version_repository import ModVersionRepository
from app.repositories.profile_repository import ProfileRepository
from app.repositories.sync_status_repository import SyncStatusRepository

logger = logging.getLogger(__name__)

_semaphore = asyncio.Semaphore(5)


async def sync_all_mods() -> None:
    async with async_session() as session:
        sync_repo = SyncStatusRepository(session)
        sync_status = SyncStatus(status="running")
        await sync_repo.create(sync_status)
        await session.commit()

        try:
            mod_repo = ModRepository(session)
            profile_repo = ProfileRepository(session)
            version_repo = ModVersionRepository(session)

            mods = await mod_repo.get_all_with_provider_ids()
            sync_status.mods_checked = len(mods)

            providers = get_all_providers()

            for mod in mods:
                loaders = await profile_repo.get_all_loaders_for_mod(mod.id)
                if not loaders:
                    continue

                if mod.modrinth_id and "modrinth" in providers:
                    await _fetch_and_store(
                        version_repo, providers["modrinth"], mod.id, mod.modrinth_id, loaders
                    )

            sync_status.status = "completed"
            sync_status.completed_at = datetime.utcnow()
            await session.commit()
            logger.info("Sync completed: %d mods checked", sync_status.mods_checked)

        except Exception as e:
            logger.exception("Sync failed: %s", e)
            sync_status.status = "failed"
            sync_status.error_message = str(e)
            sync_status.completed_at = datetime.utcnow()
            await session.commit()


async def _fetch_and_store(version_repo, provider, mod_id, project_id, loaders):
    async with _semaphore:
        try:
            versions = await provider.get_versions(project_id, loaders=loaders)
            await version_repo.delete_by_mod_and_provider(mod_id, provider.name)
            await version_repo.bulk_upsert(mod_id, versions)
        except Exception:
            logger.exception("Failed to fetch versions for mod %d from %s", mod_id, provider.name)
