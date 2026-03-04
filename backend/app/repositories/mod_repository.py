from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Mod


class ModRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_all(self) -> list[Mod]:
        result = await self._session.execute(select(Mod).order_by(Mod.name))
        return list(result.scalars().all())

    async def get_by_id(self, mod_id: int) -> Mod | None:
        return await self._session.get(Mod, mod_id)

    async def find_by_modrinth_id(self, modrinth_id: str) -> Mod | None:
        result = await self._session.execute(select(Mod).where(Mod.modrinth_id == modrinth_id))
        return result.scalar_one_or_none()

    async def find_by_slug(self, slug: str) -> Mod | None:
        result = await self._session.execute(select(Mod).where(Mod.slug == slug))
        return result.scalar_one_or_none()

    async def search(self, query: str) -> list[Mod]:
        result = await self._session.execute(
            select(Mod).where(Mod.name.ilike(f"%{query}%")).order_by(Mod.name)
        )
        return list(result.scalars().all())

    async def create(self, mod: Mod) -> Mod:
        self._session.add(mod)
        await self._session.flush()
        return mod

    async def update(self, mod: Mod) -> Mod:
        await self._session.flush()
        return mod

    async def delete(self, mod: Mod) -> None:
        await self._session.delete(mod)
        await self._session.flush()

    async def get_all_with_provider_ids(self) -> list[Mod]:
        result = await self._session.execute(
            select(Mod).where((Mod.modrinth_id.isnot(None)) | (Mod.curseforge_id.isnot(None)))
        )
        return list(result.scalars().all())
