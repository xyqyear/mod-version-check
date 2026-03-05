# CLAUDE.md

## Project Overview

**Mod Version Checker** is a full-stack web application that tracks Minecraft mod updates from CurseForge and Modrinth. It periodically checks for new mod versions and presents them in a visual dashboard with a version compatibility matrix.

**Tech Stack:**

- Backend: FastAPI, SQLAlchemy (async), aiosqlite, httpx, APScheduler, Pydantic Settings
- Frontend: Vite, React 19, TypeScript, TanStack Query v5, Tailwind CSS v4, Ant Design, ky
- Tooling: uv (Python), pnpm (Node.js)

## Repository Structure

```text
mod-version-check/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app (dual-app: api_app at /api, app serves SPA)
│   │   ├── config.py            # Pydantic Settings (DB, sync, provider URLs, auth_token)
│   │   ├── auth.py              # require_auth dependency (Bearer token, secrets.compare_digest)
│   │   ├── db.py                # Async SQLAlchemy engine + session + migrations
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
│   │   ├── main.tsx             # Entry: ConfigProvider + QueryClient + BrowserRouter + AuthProvider
│   │   ├── App.tsx              # Route definitions (AppLayout wrapper, /login, ProtectedRoute)
│   │   ├── lib/
│   │   │   ├── api.ts           # ky HTTP client with auth token injection and 401 handling
│   │   │   └── query-keys.ts    # Query key factory
│   │   ├── hooks/
│   │   │   ├── api/             # Pure API functions (profiles, mods, search, sync, auth)
│   │   │   ├── queries/         # useQuery wrappers
│   │   │   └── mutations/       # useMutation wrappers
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx   # AuthProvider + useAuth hook (isAuthRequired, canEdit, login, logout)
│   │   ├── pages/
│   │   │   ├── Home.tsx         # Profile cards grid + create modal (auth-aware)
│   │   │   ├── Login.tsx        # Token input card, validates via /auth/check
│   │   │   ├── ProfileDetail.tsx # Version matrix + mod management + inline rename + game version filter (auth-aware)
│   │   │   └── Settings.tsx     # Profiles/mods registry management (protected route)
│   │   ├── components/
│   │   │   ├── AppLayout.tsx    # Layout with header nav + sync badge + login/logout button (auth-aware)
│   │   │   ├── ProtectedRoute.tsx # Redirects to /login if auth required but not authenticated
│   │   │   ├── ProfileCard.tsx  # Profile summary card
│   │   │   ├── VersionMatrix.tsx # Ant Design Table with version cells
│   │   │   ├── VersionCell.tsx  # Color-coded version tag with tooltip
│   │   │   ├── CreateProfileModal.tsx
│   │   │   ├── ModSearchModal.tsx # Debounced provider search + add
│   │   │   └── SyncStatusBadge.tsx # Sync status display + trigger button (auth-aware)
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

### Authentication

- Optional shared-token auth via `AUTH_TOKEN` env var
- When `AUTH_TOKEN` is unset/empty, auth is disabled (all features open)
- Backend: `require_auth` FastAPI dependency on mutating endpoints; compares Bearer token using `secrets.compare_digest`
- Frontend: token stored in localStorage, injected via ky `beforeRequest` hook; 401 responses auto-clear token and redirect to `/login`
- `AuthContext` provides `useAuth()` → `{ isAuthRequired, isAuthenticated, canEdit, login, logout }`
- `canEdit = isAuthenticated || !isAuthRequired` — UI elements conditionally shown based on this flag
- Public visitors can view profiles, matrices, mod lists; editing requires authentication when auth is enabled

### Backend Layers

- **Auth**: `require_auth` dependency checks Bearer token against `settings.auth_token`; skips when token is unset
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
- `AuthProvider` wraps app inside `BrowserRouter`, checks `/auth/required` on mount

### API Endpoints

| Group    | Endpoints                                                                                                                          | Auth              |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Auth     | `GET /auth/required`, `GET /auth/check`                                                                                            | public, protected |
| Profiles | `GET /profiles`, `GET /profiles/{id}`, `GET /profiles/{id}/matrix`                                                                 | public            |
| Profiles | `POST /profiles`, `PUT /profiles/{id}`, `DELETE /profiles/{id}`, `POST /profiles/{id}/mods`, `DELETE /profiles/{id}/mods/{mod_id}` | protected         |
| Mods     | `GET /mods`, `GET /mods/{id}`                                                                                                      | public            |
| Mods     | `POST /mods`, `PUT /mods/{id}`, `DELETE /mods/{id}`                                                                                | protected         |
| Search   | `GET /search/mods?query=&loader=&game_version=&provider=`                                                                          | protected         |
| Sync     | `GET /sync/status`                                                                                                                 | public            |
| Sync     | `POST /sync/trigger`                                                                                                               | protected         |

### Models

- **Mod**: Tracked mod with optional modrinth_id/curseforge_id
- **Profile**: Named group of mods with a loader type (fabric/forge/neoforge/quilt) and optional `game_versions` filter (JSON-encoded list of pinned game versions for matrix display)
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
