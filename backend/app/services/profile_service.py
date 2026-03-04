from sqlalchemy.ext.asyncio import AsyncSession

from app.models import LoaderType, Profile
from app.repositories.mod_repository import ModRepository
from app.repositories.profile_repository import ProfileRepository


class ProfileService:
    def __init__(self, session: AsyncSession):
        self._profile_repo = ProfileRepository(session)
        self._mod_repo = ModRepository(session)
        self._session = session

    async def get_all(self) -> list[Profile]:
        return await self._profile_repo.get_all()

    async def get_by_id(self, profile_id: int) -> Profile | None:
        return await self._profile_repo.get_by_id(profile_id)

    async def create(self, name: str, loader: LoaderType, game_versions: list[str] | None = None) -> Profile:
        profile = Profile(name=name, loader=loader, game_versions=game_versions)
        profile = await self._profile_repo.create(profile)
        await self._session.commit()
        refreshed = await self._profile_repo.get_by_id(profile.id)
        assert refreshed is not None
        return refreshed

    async def update(self, profile_id: int, **kwargs) -> Profile | None:
        profile = await self._profile_repo.get_by_id(profile_id)
        if not profile:
            return None
        for key, value in kwargs.items():
            if hasattr(profile, key):
                setattr(profile, key, value)
        profile = await self._profile_repo.update(profile)
        await self._session.commit()
        refreshed = await self._profile_repo.get_by_id(profile.id)
        assert refreshed is not None
        return refreshed

    async def delete(self, profile_id: int) -> bool:
        profile = await self._profile_repo.get_by_id(profile_id)
        if not profile:
            return False
        await self._profile_repo.delete(profile)
        await self._session.commit()
        return True

    async def add_mod(self, profile_id: int, mod_id: int) -> Profile | None:
        profile = await self._profile_repo.get_by_id(profile_id)
        if not profile:
            return None
        mod = await self._mod_repo.get_by_id(mod_id)
        if not mod:
            return None
        await self._profile_repo.add_mod(profile, mod)
        await self._session.commit()
        return profile

    async def remove_mod(self, profile_id: int, mod_id: int) -> Profile | None:
        profile = await self._profile_repo.get_by_id(profile_id)
        if not profile:
            return None
        mod = await self._mod_repo.get_by_id(mod_id)
        if not mod:
            return None
        await self._profile_repo.remove_mod(profile, mod)
        await self._session.commit()
        return profile
