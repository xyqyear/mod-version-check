from sqlalchemy import delete, select
from sqlalchemy.dialects.sqlite import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ModVersion
from app.providers.schemas import ProviderVersionInfo


class ModVersionRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def bulk_upsert(self, mod_id: int, versions: list[ProviderVersionInfo]) -> None:
        if not versions:
            return

        for v in versions:
            for loader in v.loaders:
                for game_version in v.game_versions:
                    stmt = insert(ModVersion).values(
                        mod_id=mod_id,
                        provider=v.provider,
                        loader=loader,
                        game_version=game_version,
                        version_number=v.version_number,
                        version_name=v.version_name,
                        version_type=v.version_type,
                        date_published=v.date_published,
                        provider_version_id=v.version_id,
                    )
                    stmt = stmt.on_conflict_do_update(
                        index_elements=["mod_id", "provider", "loader", "game_version", "provider_version_id"],
                        set_={
                            "version_number": stmt.excluded.version_number,
                            "version_name": stmt.excluded.version_name,
                            "version_type": stmt.excluded.version_type,
                            "date_published": stmt.excluded.date_published,
                        },
                    )
                    await self._session.execute(stmt)
        await self._session.flush()

    async def delete_by_mod_and_provider(self, mod_id: int, provider: str) -> None:
        await self._session.execute(
            delete(ModVersion).where(ModVersion.mod_id == mod_id, ModVersion.provider == provider)
        )
        await self._session.flush()

    async def get_matrix_data(self, mod_ids: list[int], loader: str) -> list[ModVersion]:
        if not mod_ids:
            return []
        result = await self._session.execute(
            select(ModVersion)
            .where(
                ModVersion.mod_id.in_(mod_ids),
                ModVersion.loader == loader,
            )
            .order_by(ModVersion.date_published.desc())
        )
        return list(result.scalars().all())
