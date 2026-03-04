from app.providers import get_all_providers, get_provider
from app.providers.schemas import SearchResult
from app.repositories.mod_repository import ModRepository
from sqlalchemy.ext.asyncio import AsyncSession


class SearchService:
    def __init__(self, session: AsyncSession):
        self._mod_repo = ModRepository(session)

    async def search_mods(
        self,
        query: str,
        loader: str | None = None,
        game_version: str | None = None,
        provider_name: str | None = None,
        limit: int = 10,
        offset: int = 0,
    ) -> dict:
        if provider_name:
            provider = get_provider(provider_name)
            result = await provider.search_mods(query, loader, game_version, limit, offset)
        else:
            results = []
            for provider in get_all_providers().values():
                r = await provider.search_mods(query, loader, game_version, limit, offset)
                results.append(r)

            all_hits = []
            total = 0
            for r in results:
                all_hits.extend(r.hits)
                total += r.total_hits
            result = SearchResult(hits=all_hits, total_hits=total, offset=offset, limit=limit)

        hits_with_local = []
        for hit in result.hits:
            existing_mod = await self._mod_repo.find_by_modrinth_id(hit.project_id) if hit.provider == "modrinth" else None
            hits_with_local.append({
                "provider": hit.provider,
                "project_id": hit.project_id,
                "slug": hit.slug,
                "name": hit.name,
                "description": hit.description,
                "icon_url": hit.icon_url,
                "downloads": hit.downloads,
                "loaders": hit.loaders,
                "game_versions": hit.game_versions,
                "existing_mod_id": existing_mod.id if existing_mod else None,
            })

        return {
            "hits": hits_with_local,
            "total_hits": result.total_hits,
            "offset": result.offset,
            "limit": result.limit,
        }
