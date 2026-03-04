import httpx

from app.config import settings
from app.providers.base import ModProvider
from app.providers.modrinth import ModrinthProvider

_providers: dict[str, ModProvider] = {}


def init_providers(client: httpx.AsyncClient) -> None:
    _providers["modrinth"] = ModrinthProvider(
        client=client,
        base_url=settings.modrinth_base_url,
        user_agent=settings.modrinth_user_agent,
    )


def get_provider(name: str) -> ModProvider:
    return _providers[name]


def get_all_providers() -> dict[str, ModProvider]:
    return _providers
