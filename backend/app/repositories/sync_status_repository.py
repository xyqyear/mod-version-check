from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SyncStatus


class SyncStatusRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create(self, sync_status: SyncStatus) -> SyncStatus:
        self._session.add(sync_status)
        await self._session.flush()
        return sync_status

    async def update(self, sync_status: SyncStatus) -> SyncStatus:
        await self._session.flush()
        return sync_status

    async def get_latest(self) -> SyncStatus | None:
        result = await self._session.execute(
            select(SyncStatus).order_by(SyncStatus.started_at.desc()).limit(1)
        )
        return result.scalar_one_or_none()
