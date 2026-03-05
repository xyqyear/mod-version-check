from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_auth
from app.db import get_db
from app.routers.schemas import SyncStatusResponse
from app.repositories.sync_status_repository import SyncStatusRepository
from app.services.sync_service import sync_all_mods

router = APIRouter(prefix="/sync", tags=["sync"])


@router.get("/status", response_model=SyncStatusResponse | None)
async def get_sync_status(db: AsyncSession = Depends(get_db)):
    repo = SyncStatusRepository(db)
    return await repo.get_latest()


@router.post("/trigger", response_model=dict, dependencies=[Depends(require_auth)])
async def trigger_sync():
    import asyncio
    asyncio.create_task(sync_all_mods())
    return {"message": "Sync triggered"}
