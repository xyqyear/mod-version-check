from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class ProviderModInfo:
    provider: str
    project_id: str
    slug: str
    name: str
    description: str
    icon_url: str | None
    downloads: int
    loaders: list[str]
    game_versions: list[str]


@dataclass(frozen=True)
class ProviderVersionInfo:
    provider: str
    version_id: str
    project_id: str
    version_number: str
    version_name: str | None
    version_type: str
    loaders: list[str]
    game_versions: list[str]
    date_published: datetime


@dataclass(frozen=True)
class SearchResult:
    hits: list[ProviderModInfo]
    total_hits: int
    offset: int
    limit: int
