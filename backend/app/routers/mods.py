from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.routers.schemas import ModCreate, ModResponse, ModUpdate
from app.services.mod_service import ModService

router = APIRouter(prefix="/mods", tags=["mods"])


@router.get("", response_model=list[ModResponse])
async def list_mods(search: str | None = None, db: AsyncSession = Depends(get_db)):
    service = ModService(db)
    return await service.get_all(search=search)


@router.post("", response_model=ModResponse, status_code=201)
async def create_mod(data: ModCreate, db: AsyncSession = Depends(get_db)):
    service = ModService(db)
    return await service.create(**data.model_dump())


@router.get("/{mod_id}", response_model=ModResponse)
async def get_mod(mod_id: int, db: AsyncSession = Depends(get_db)):
    service = ModService(db)
    mod = await service.get_by_id(mod_id)
    if not mod:
        raise HTTPException(status_code=404, detail="Mod not found")
    return mod


@router.put("/{mod_id}", response_model=ModResponse)
async def update_mod(mod_id: int, data: ModUpdate, db: AsyncSession = Depends(get_db)):
    service = ModService(db)
    mod = await service.update(mod_id, **data.model_dump(exclude_unset=True))
    if not mod:
        raise HTTPException(status_code=404, detail="Mod not found")
    return mod


@router.delete("/{mod_id}", status_code=204)
async def delete_mod(mod_id: int, db: AsyncSession = Depends(get_db)):
    service = ModService(db)
    if not await service.delete(mod_id):
        raise HTTPException(status_code=404, detail="Mod not found")
