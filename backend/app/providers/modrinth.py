import json
import logging
from datetime import datetime
from typing import Any

import httpx

from app.providers.base import ModProvider
from app.providers.schemas import ProviderModInfo, ProviderVersionInfo, SearchResult

logger = logging.getLogger(__name__)


class ModrinthProvider(ModProvider):
    name = "modrinth"

    def __init__(self, client: httpx.AsyncClient, base_url: str, user_agent: str):
        self._client = client
        self._base_url = base_url.rstrip("/")
        self._user_agent = user_agent

    def _headers(self) -> dict[str, str]:
        return {"User-Agent": self._user_agent}

    def _check_rate_limit(self, response: httpx.Response) -> None:
        remaining = response.headers.get("X-Ratelimit-Remaining")
        if remaining is not None and int(remaining) < 20:
            logger.warning("Modrinth rate limit low: %s remaining", remaining)

    async def _request(self, path: str, params: dict[str, Any] | None = None) -> Any:
        response = await self._client.get(
            f"{self._base_url}{path}",
            params=params,
            headers=self._headers(),
        )
        self._check_rate_limit(response)
        response.raise_for_status()
        return response.json()

    async def _get_dict(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        return await self._request(path, params)

    async def _get_list(self, path: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        return await self._request(path, params)

    async def search_mods(
        self,
        query: str,
        loader: str | None = None,
        game_version: str | None = None,
        limit: int = 10,
        offset: int = 0,
    ) -> SearchResult:
        facets: list[list[str]] = [["project_type:mod"]]
        if loader:
            facets.append([f"categories:{loader}"])
        if game_version:
            facets.append([f"versions:{game_version}"])

        params: dict[str, Any] = {
            "query": query,
            "facets": json.dumps(facets),
            "limit": limit,
            "offset": offset,
        }
        data = await self._get_dict("/search", params=params)
        hits = [self._map_search_hit(h) for h in data["hits"]]
        return SearchResult(
            hits=hits,
            total_hits=data["total_hits"],
            offset=data["offset"],
            limit=data["limit"],
        )

    async def get_mod(self, project_id: str) -> ProviderModInfo:
        data = await self._get_dict(f"/project/{project_id}")
        return self._map_project(data)

    async def get_mods(self, project_ids: list[str]) -> list[ProviderModInfo]:
        if not project_ids:
            return []
        data = await self._get_list("/projects", params={"ids": json.dumps(project_ids)})
        return [self._map_project(p) for p in data]

    async def get_versions(
        self,
        project_id: str,
        loaders: list[str] | None = None,
        game_versions: list[str] | None = None,
    ) -> list[ProviderVersionInfo]:
        params: dict[str, Any] = {}
        if loaders:
            params["loaders"] = json.dumps(loaders)
        if game_versions:
            params["game_versions"] = json.dumps(game_versions)

        data = await self._get_list(f"/project/{project_id}/version", params=params)
        return [self._map_version(v) for v in data]

    def _map_search_hit(self, hit: dict[str, Any]) -> ProviderModInfo:
        return ProviderModInfo(
            provider=self.name,
            project_id=hit["project_id"],
            slug=hit["slug"],
            name=hit["title"],
            description=hit.get("description", ""),
            icon_url=hit.get("icon_url"),
            downloads=hit.get("downloads", 0),
            loaders=[c for c in hit.get("categories", []) if c in ("fabric", "forge", "neoforge", "quilt")],
            game_versions=hit.get("versions", []),
        )

    def _map_project(self, data: dict[str, Any]) -> ProviderModInfo:
        return ProviderModInfo(
            provider=self.name,
            project_id=data["id"],
            slug=data["slug"],
            name=data["title"],
            description=data.get("description", ""),
            icon_url=data.get("icon_url"),
            downloads=data.get("downloads", 0),
            loaders=data.get("loaders", []),
            game_versions=data.get("game_versions", []),
        )

    def _map_version(self, v: dict[str, Any]) -> ProviderVersionInfo:
        return ProviderVersionInfo(
            provider=self.name,
            version_id=v["id"],
            project_id=v["project_id"],
            version_number=v.get("version_number", ""),
            version_name=v.get("name"),
            version_type=v.get("version_type", "release"),
            loaders=v.get("loaders", []),
            game_versions=v.get("game_versions", []),
            date_published=datetime.fromisoformat(v["date_published"].replace("Z", "+00:00")),
        )
