from abc import ABC, abstractmethod

from app.providers.schemas import ProviderModInfo, ProviderVersionInfo, SearchResult


class ModProvider(ABC):
    name: str

    @abstractmethod
    async def search_mods(
        self,
        query: str,
        loader: str | None = None,
        game_version: str | None = None,
        limit: int = 10,
        offset: int = 0,
    ) -> SearchResult: ...

    @abstractmethod
    async def get_mod(self, project_id: str) -> ProviderModInfo: ...

    @abstractmethod
    async def get_mods(self, project_ids: list[str]) -> list[ProviderModInfo]: ...

    @abstractmethod
    async def get_versions(
        self,
        project_id: str,
        loaders: list[str] | None = None,
        game_versions: list[str] | None = None,
    ) -> list[ProviderVersionInfo]: ...
