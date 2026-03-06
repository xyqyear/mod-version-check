from collections import defaultdict

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ModVersion
from app.repositories.mod_version_repository import ModVersionRepository
from app.repositories.profile_repository import ProfileRepository


VERSION_TYPE_PRIORITY = {"release": 0, "beta": 1, "alpha": 2}


class MatrixService:
    def __init__(self, session: AsyncSession):
        self._profile_repo = ProfileRepository(session)
        self._version_repo = ModVersionRepository(session)

    async def get_matrix(self, profile_id: int) -> dict | None:
        profile = await self._profile_repo.get_by_id(profile_id)
        if not profile:
            return None

        mod_ids = [m.id for m in profile.mods]
        if not mod_ids:
            return {"game_versions": [], "all_game_versions": [], "mods": [], "last_synced_at": None}

        versions = await self._version_repo.get_matrix_data(mod_ids, profile.loader.value)

        game_version_set: set[str] = set()
        mod_versions: dict[int, list[ModVersion]] = defaultdict(list)
        for v in versions:
            game_version_set.add(v.game_version)
            mod_versions[v.mod_id].append(v)

        all_game_versions = sorted(game_version_set, key=_version_sort_key, reverse=True)

        if profile.game_versions:
            game_versions = [gv for gv in profile.game_versions if gv in game_version_set]
        else:
            game_versions = all_game_versions

        mods_data = []
        for mod in profile.mods:
            versions_map = {}
            for gv in game_versions:
                best = _pick_best_version(mod_versions.get(mod.id, []), gv)
                if best:
                    versions_map[gv] = {
                        "available": True,
                        "version_number": best.version_number,
                        "version_type": best.version_type,
                        "date_published": best.date_published.isoformat(),
                    }
                else:
                    versions_map[gv] = {"available": False}

            mods_data.append({
                "mod_id": mod.id,
                "mod_name": mod.name,
                "icon_url": mod.icon_url,
                "modrinth_id": mod.modrinth_id,
                "curseforge_id": mod.curseforge_id,
                "synced": mod.last_synced_at is not None,
                "versions": versions_map,
            })

        return {
            "game_versions": game_versions,
            "all_game_versions": all_game_versions,
            "mods": mods_data,
            "last_synced_at": None,
        }


def _pick_best_version(versions: list[ModVersion], game_version: str) -> ModVersion | None:
    matching = [v for v in versions if v.game_version == game_version]
    if not matching:
        return None
    return min(
        matching,
        key=lambda v: (VERSION_TYPE_PRIORITY.get(v.version_type, 3), -v.date_published.timestamp()),
    )


def _version_sort_key(version: str) -> list[int]:
    parts = []
    for part in version.split("."):
        try:
            parts.append(int(part))
        except ValueError:
            parts.append(0)
    return parts
