from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.routers.schemas import SearchResponse
from app.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/mods", response_model=SearchResponse)
async def search_mods(
    query: str,
    loader: str | None = None,
    game_version: str | None = None,
    provider: str | None = None,
    limit: int = 10,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    service = SearchService(db)
    return await service.search_mods(
        query=query,
        loader=loader,
        game_version=game_version,
        provider_name=provider,
        limit=limit,
        offset=offset,
    )
