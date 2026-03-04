# CLAUDE.md

## Project Overview

**Mod Version Checker** is a full-stack web application that tracks Minecraft mod updates from CurseForge and Modrinth. It periodically checks for new mod versions and presents them in a visual dashboard with a version compatibility matrix.

**Tech Stack:**
- Backend: FastAPI, SQLAlchemy (async), aiosqlite, httpx, APScheduler, Pydantic Settings
- Frontend: Vite, React 19, TypeScript, TanStack Query v5, Tailwind CSS v4, Ant Design, ky
- Tooling: uv (Python), pnpm (Node.js)

## Repository Structure

```
mod-version-check/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app (dual-app: api_app at /api, app serves SPA)
│   │   ├── config.py            # Pydantic Settings (DB, sync, provider URLs)
│   │   ├── db.py                # Async SQLAlchemy engine + session
│   │   ├── models.py            # ORM: Mod, Profile, ModVersion, SyncStatus, profile_mods
│   │   ├── scheduler.py         # APScheduler background sync job
│   │   ├── providers/
│   │   │   ├── __init__.py      # Provider registry (init_providers, get_provider)
│   │   │   ├── base.py          # ModProvider ABC
│   │   │   ├── schemas.py       # ProviderModInfo, ProviderVersionInfo, SearchResult
│   │   │   └── modrinth.py      # Modrinth API v2 implementation
│   │   ├── repositories/
│   │   │   ├── mod_repository.py
│   │   │   ├── profile_repository.py
│   │   │   ├── mod_version_repository.py
│   │   │   └── sync_status_repository.py
│   │   ├── services/
│   │   │   ├── mod_service.py
│   │   │   ├── profile_service.py
│   │   │   ├── search_service.py
│   │   │   ├── matrix_service.py
│   │   │   └── sync_service.py
│   │   └── routers/
│   │       ├── schemas/
│   │       │   └── __init__.py  # All Pydantic request/response schemas
│   │       ├── profiles.py      # /api/profiles + /api/profiles/{id}/matrix
│   │       ├── mods.py          # /api/mods CRUD
│   │       ├── search.py        # /api/search/mods (provider search)
│   │       └── sync.py          # /api/sync/status, /api/sync/trigger
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── main.tsx             # Entry: ConfigProvider + QueryClient + BrowserRouter
│   │   ├── App.tsx              # Route definitions (AppLayout wrapper)
│   │   ├── lib/
│   │   │   ├── api.ts           # ky HTTP client
│   │   │   └── query-keys.ts    # Query key factory
│   │   ├── hooks/
│   │   │   ├── api/             # Pure API functions (profiles, mods, search, sync)
│   │   │   ├── queries/         # useQuery wrappers
│   │   │   └── mutations/       # useMutation wrappers
│   │   ├── pages/
│   │   │   ├── Home.tsx         # Profile cards grid + create modal
│   │   │   ├── ProfileDetail.tsx # Version matrix + mod management
│   │   │   └── Settings.tsx     # Profiles/mods registry management
│   │   ├── components/
│   │   │   ├── AppLayout.tsx    # Layout with header nav + sync badge
│   │   │   ├── ProfileCard.tsx  # Profile summary card
│   │   │   ├── VersionMatrix.tsx # Ant Design Table with version cells
│   │   │   ├── VersionCell.tsx  # Color-coded version tag with tooltip
│   │   │   ├── CreateProfileModal.tsx
│   │   │   ├── ModSearchModal.tsx # Debounced provider search + add
│   │   │   └── SyncStatusBadge.tsx
│   │   └── types/
│   │       └── index.ts         # All TypeScript interfaces
│   └── vite.config.ts
├── docs/
│   ├── curseforge-api.md
│   └── modrinth-api.md
├── .vscode/
├── Dockerfile
├── compose.yaml
└── .github/workflows/
```

## Development Commands

```bash
# Backend
cd backend && uv run uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && pnpm dev

# Docker
docker compose up -d
```

## Architecture

- Backend serves API at `/api/*` and SPA frontend at all other routes
- Frontend proxies `/api` to backend in dev mode (vite.config.ts)
- Database: SQLite stored at `backend/data/db.sqlite3`

### Backend Layers
- **Providers**: Abstract `ModProvider` interface with Modrinth implementation; registry pattern for multi-provider support
- **Repositories**: Data access layer (mod, profile, mod_version, sync_status)
- **Services**: Business logic (CRUD, search proxy, version matrix builder, background sync)
- **Routers**: FastAPI endpoints with Pydantic schemas

### Frontend Layers
- **API functions** (`hooks/api/`) → **Query hooks** (`hooks/queries/`) → **Components** (3-layer pattern)
- **Mutation hooks** (`hooks/mutations/`) invalidate relevant query keys on success
- Query keys centralized in `lib/query-keys.ts`
- UI: Ant Design components with Tailwind CSS v4 utility classes
- Ant Design ConfigProvider wraps app for theme customization

### API Endpoints

| Group | Endpoints |
|-------|-----------|
| Profiles | `GET/POST /profiles`, `GET/PUT/DELETE /profiles/{id}`, `POST/DELETE /profiles/{id}/mods`, `GET /profiles/{id}/matrix` |
| Mods | `GET/POST /mods`, `GET/PUT/DELETE /mods/{id}` |
| Search | `GET /search/mods?query=&loader=&game_version=&provider=` |
| Sync | `GET /sync/status`, `POST /sync/trigger` |

### Models
- **Mod**: Tracked mod with optional modrinth_id/curseforge_id
- **Profile**: Named group of mods with a loader type (fabric/forge/neoforge/quilt)
- **ModVersion**: Cached version data per mod/provider/loader/game_version
- **SyncStatus**: Background sync job status tracking
- **profile_mods**: M2M association table

### Background Sync
- APScheduler runs `sync_all_mods()` at configurable interval (default 30min)
- Fetches versions from providers for all mods referenced by profiles
- Semaphore limits concurrent provider requests to 5
- Optional sync-on-startup via `SYNC_ON_STARTUP` env var

## Keeping This File Current

This file must always reflect the current state of the codebase. When planning changes that modify the project structure, API surface, or architecture, include CLAUDE.md updates in the plan. Write the file as if from scratch for the current state — no changelogs or "updated X" notes.
