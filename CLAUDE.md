# CLAUDE.md

## Project Overview

**Mod Version Checker** is a full-stack web application that tracks Minecraft mod updates from CurseForge and Modrinth. It periodically checks for new mod versions and presents them in a visual dashboard with a version compatibility matrix.

**Tech Stack:**

- Backend: FastAPI, SQLAlchemy (async), aiosqlite, httpx, APScheduler, Pydantic Settings
- Frontend: Vite, React 19, TypeScript, TanStack Query v5, Tailwind CSS v4, shadcn/ui, Radix UI, Sonner, lucide-react, ky, fflate
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
│   │   ├── main.tsx             # Entry: ThemeProvider + QueryClient + BrowserRouter + TooltipProvider + AuthProvider + Toaster
│   │   ├── App.tsx              # Route definitions (AppLayout wrapper, /login, ProtectedRoute)
│   │   ├── index.css            # Tailwind CSS v4 + shadcn theme variables (light/dark)
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui generated components (button, card, dialog, etc.)
│   │   │   ├── theme-provider.tsx # ThemeProvider + useTheme (dark/light/system)
│   │   │   ├── mode-toggle.tsx  # Theme toggle dropdown
│   │   │   ├── app-sidebar.tsx  # Sidebar with nav, theme toggle, login/logout
│   │   │   ├── app-header.tsx   # Header with SidebarTrigger + Breadcrumb + SyncStatusBadge
│   │   │   ├── AppLayout.tsx    # SidebarProvider + AppSidebar + SidebarInset + header + Outlet
│   │   │   ├── ProtectedRoute.tsx # Redirects to /login if auth required but not authenticated
│   │   │   ├── ProfileCard.tsx  # Profile summary card
│   │   │   ├── VersionMatrix.tsx # shadcn Table with sticky first column + per-column download button
│   │   │   ├── VersionCell.tsx  # Color-coded version badge with tooltip
│   │   │   ├── CreateProfileModal.tsx # Dialog with Input + Select, controlled state
│   │   │   ├── ModSearchModal.tsx # Dialog with search Input, scrollable results, add button
│   │   │   ├── DownloadModsModal.tsx # Dialog with Progress bar, per-mod status, AlertDialog cancel
│   │   │   └── SyncStatusBadge.tsx # Badge + Tooltip + RefreshCw icon button
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx   # AuthProvider + useAuth hook (isAuthRequired, canEdit, login, logout)
│   │   ├── pages/
│   │   │   ├── Home.tsx         # Profile cards grid + create button + CreateProfileModal
│   │   │   ├── Login.tsx        # Centered card with password input, toast.error on failure
│   │   │   ├── ProfileDetail.tsx # Version matrix + mod management + inline rename + game version filter + download
│   │   │   └── Settings.tsx     # Tabs (Profiles / Mods Registry) with delete via AlertDialog
│   │   ├── hooks/
│   │   │   ├── api/             # Pure API functions (profiles, mods, search, sync, auth)
│   │   │   ├── queries/         # useQuery wrappers
│   │   │   └── mutations/       # useMutation wrappers
│   │   ├── lib/
│   │   │   ├── api.ts           # ky HTTP client with auth token injection and 401 handling
│   │   │   ├── query-keys.ts    # Query key factory
│   │   │   ├── utils.ts         # cn() utility from shadcn init
│   │   │   ├── download-service.ts # Download orchestration: resolve → download → zip
│   │   │   └── download-providers/
│   │   │       ├── types.ts     # DownloadProvider & ModFileInfo interfaces
│   │   │       ├── modrinth.ts  # Modrinth CDN download provider
│   │   │       └── index.ts     # Provider registry (getDownloadProvider)
│   │   └── types/
│   │       └── index.ts         # All TypeScript interfaces
│   ├── components.json          # shadcn configuration
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
- UI: shadcn/ui components (Radix UI primitives) with Tailwind CSS v4 utility classes
- Dark mode via ThemeProvider + `dark` class on `<html>`, persisted to localStorage
- Toast notifications via Sonner (`toast.success()`, `toast.error()`)
- Sidebar-based layout (`collapsible="icon"`, `variant="inset"`)
- `AuthProvider` wraps app inside `BrowserRouter`, checks `/auth/required` on mount

### Mod Download

- One-click download of all mods for a specific game version column, delivered as a zip archive
- Download button appears in each game version column header in the version matrix
- **Download providers** (`lib/download-providers/`): abstract `DownloadProvider` interface with Modrinth implementation; calls Modrinth API v2 directly from browser (CORS-enabled, no API key needed)
- **Download service** (`lib/download-service.ts`): orchestrates three phases — resolve (get file URLs from providers), download (fetch files with byte-level progress via ReadableStream), zip (pack with fflate at compression level 0)
- Progress callback emits per-mod status (pending → resolving → downloading → done/skipped/error) and overall progress
- `DownloadModsModal` shows phase text, overall progress bar, and per-mod list with inline progress/status badges
- Uses native `fetch` (not ky) for external Modrinth API/CDN calls
- Mods without a provider ID (e.g., `modrinth_id`) are skipped
- Matrix API (`ModRow`) exposes `modrinth_id` and `curseforge_id` for provider lookup

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

### Background Tasks

- Background tasks use `asyncio.create_task` with standalone async functions that open their own `async_session()`
- `sync_single_mod` (sync_service): triggered after adding a mod to a profile
- `delete_orphaned_mod` (mod_service): triggered after removing a mod from a profile; deletes the mod if no profiles reference it

## Keeping This File Current

This file must always reflect the current state of the codebase. When planning changes that modify the project structure, API surface, or architecture, include CLAUDE.md updates in the plan. Write the file as if from scratch for the current state — no changelogs or "updated X" notes.
