from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Mod
from app.repositories.mod_repository import ModRepository


class ModService:
    def __init__(self, session: AsyncSession):
        self._repo = ModRepository(session)
        self._session = session

    async def get_all(self, search: str | None = None) -> list[Mod]:
        if search:
            return await self._repo.search(search)
        return await self._repo.get_all()

    async def get_by_id(self, mod_id: int) -> Mod | None:
        return await self._repo.get_by_id(mod_id)

    async def create(
        self,
        name: str,
        slug: str,
        icon_url: str | None = None,
        modrinth_id: str | None = None,
        curseforge_id: int | None = None,
    ) -> Mod:
        mod = Mod(
            name=name,
            slug=slug,
            icon_url=icon_url,
            modrinth_id=modrinth_id,
            curseforge_id=curseforge_id,
        )
        mod = await self._repo.create(mod)
        await self._session.commit()
        return mod

    async def update(self, mod_id: int, **kwargs) -> Mod | None:
        mod = await self._repo.get_by_id(mod_id)
        if not mod:
            return None
        for key, value in kwargs.items():
            if hasattr(mod, key):
                setattr(mod, key, value)
        mod = await self._repo.update(mod)
        await self._session.commit()
        return mod

    async def delete(self, mod_id: int) -> bool:
        mod = await self._repo.get_by_id(mod_id)
        if not mod:
            return False
        await self._repo.delete(mod)
        await self._session.commit()
        return True
