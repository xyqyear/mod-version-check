from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Mod, Profile, profile_mods


class ProfileRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_all(self) -> list[Profile]:
        result = await self._session.execute(
            select(Profile).options(selectinload(Profile.mods)).order_by(Profile.name)
        )
        return list(result.scalars().all())

    async def get_by_id(self, profile_id: int) -> Profile | None:
        result = await self._session.execute(
            select(Profile).options(selectinload(Profile.mods)).where(Profile.id == profile_id)
        )
        return result.scalar_one_or_none()

    async def create(self, profile: Profile) -> Profile:
        self._session.add(profile)
        await self._session.flush()
        return profile

    async def update(self, profile: Profile) -> Profile:
        await self._session.flush()
        return profile

    async def delete(self, profile: Profile) -> None:
        await self._session.delete(profile)
        await self._session.flush()

    async def add_mod(self, profile: Profile, mod: Mod) -> None:
        if mod not in profile.mods:
            profile.mods.append(mod)
            await self._session.flush()

    async def remove_mod(self, profile: Profile, mod: Mod) -> None:
        if mod in profile.mods:
            profile.mods.remove(mod)
            await self._session.flush()

    async def get_all_loaders_for_mod(self, mod_id: int) -> list[str]:
        result = await self._session.execute(
            select(Profile.loader)
            .join(profile_mods, Profile.id == profile_mods.c.profile_id)
            .where(profile_mods.c.mod_id == mod_id)
            .distinct()
        )
        return [row[0].value for row in result.all()]
