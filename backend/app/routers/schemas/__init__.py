from datetime import datetime

from pydantic import BaseModel

from app.models import LoaderType


class ProfileCreate(BaseModel):
    name: str
    loader: LoaderType


class ProfileUpdate(BaseModel):
    name: str | None = None
    loader: LoaderType | None = None


class ModSummary(BaseModel):
    id: int
    name: str
    slug: str
    icon_url: str | None

    model_config = {"from_attributes": True}


class ProfileResponse(BaseModel):
    id: int
    name: str
    loader: LoaderType
    created_at: datetime
    updated_at: datetime
    mods: list[ModSummary]

    model_config = {"from_attributes": True}


class ProfileListItem(BaseModel):
    id: int
    name: str
    loader: LoaderType
    mod_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AddModRequest(BaseModel):
    mod_id: int


class ModCreate(BaseModel):
    name: str
    slug: str
    icon_url: str | None = None
    modrinth_id: str | None = None
    curseforge_id: int | None = None


class ModUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    icon_url: str | None = None


class ModResponse(BaseModel):
    id: int
    name: str
    slug: str
    icon_url: str | None
    modrinth_id: str | None
    curseforge_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SyncStatusResponse(BaseModel):
    id: int
    started_at: datetime
    completed_at: datetime | None
    mods_checked: int
    status: str
    error_message: str | None

    model_config = {"from_attributes": True}


class SearchHit(BaseModel):
    provider: str
    project_id: str
    slug: str
    name: str
    description: str
    icon_url: str | None
    downloads: int
    loaders: list[str]
    game_versions: list[str]
    existing_mod_id: int | None


class SearchResponse(BaseModel):
    hits: list[SearchHit]
    total_hits: int
    offset: int
    limit: int


class VersionCell(BaseModel):
    available: bool
    version_number: str | None = None
    version_type: str | None = None
    date_published: str | None = None


class ModRow(BaseModel):
    mod_id: int
    mod_name: str
    icon_url: str | None
    versions: dict[str, VersionCell]


class MatrixResponse(BaseModel):
    game_versions: list[str]
    mods: list[ModRow]
    last_synced_at: str | None
