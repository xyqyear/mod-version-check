import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_auth
from app.db import get_db
from app.routers.schemas import (
    AddModRequest,
    MatrixResponse,
    ProfileCreate,
    ProfileListItem,
    ProfileResponse,
    ProfileUpdate,
)
from app.services.matrix_service import MatrixService
from app.services.profile_service import ProfileService
from app.services.sync_service import sync_single_mod

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("", response_model=list[ProfileListItem])
async def list_profiles(db: AsyncSession = Depends(get_db)):
    service = ProfileService(db)
    profiles = await service.get_all()
    return [
        ProfileListItem(
            id=p.id,
            name=p.name,
            loader=p.loader,
            mod_count=len(p.mods),
            created_at=p.created_at,
            game_versions=p.game_versions,
        )
        for p in profiles
    ]


@router.post("", response_model=ProfileResponse, status_code=201, dependencies=[Depends(require_auth)])
async def create_profile(data: ProfileCreate, db: AsyncSession = Depends(get_db)):
    service = ProfileService(db)
    profile = await service.create(name=data.name, loader=data.loader, game_versions=data.game_versions)
    return profile


@router.get("/{profile_id}", response_model=ProfileResponse)
async def get_profile(profile_id: int, db: AsyncSession = Depends(get_db)):
    service = ProfileService(db)
    profile = await service.get_by_id(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/{profile_id}", response_model=ProfileResponse, dependencies=[Depends(require_auth)])
async def update_profile(profile_id: int, data: ProfileUpdate, db: AsyncSession = Depends(get_db)):
    service = ProfileService(db)
    profile = await service.update(profile_id, **data.model_dump(exclude_unset=True))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.delete("/{profile_id}", status_code=204, dependencies=[Depends(require_auth)])
async def delete_profile(profile_id: int, db: AsyncSession = Depends(get_db)):
    service = ProfileService(db)
    if not await service.delete(profile_id):
        raise HTTPException(status_code=404, detail="Profile not found")


@router.post("/{profile_id}/mods", response_model=ProfileResponse, dependencies=[Depends(require_auth)])
async def add_mod_to_profile(profile_id: int, data: AddModRequest, db: AsyncSession = Depends(get_db)):
    service = ProfileService(db)
    profile = await service.add_mod(profile_id, data.mod_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile or mod not found")
    asyncio.create_task(sync_single_mod(data.mod_id))
    return profile


@router.delete("/{profile_id}/mods/{mod_id}", response_model=ProfileResponse, dependencies=[Depends(require_auth)])
async def remove_mod_from_profile(profile_id: int, mod_id: int, db: AsyncSession = Depends(get_db)):
    service = ProfileService(db)
    profile = await service.remove_mod(profile_id, mod_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile or mod not found")
    return profile


@router.get("/{profile_id}/matrix", response_model=MatrixResponse)
async def get_profile_matrix(profile_id: int, db: AsyncSession = Depends(get_db)):
    service = MatrixService(db)
    matrix = await service.get_matrix(profile_id)
    if matrix is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return matrix
