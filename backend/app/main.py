import logging
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import init_db
from app.providers import init_providers
from app.scheduler import start_scheduler, stop_scheduler
from app.services.sync_service import sync_all_mods

PROJECT_ROOT = Path(__file__).resolve().parents[2]
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    logger.info("Database initialized")

    async with httpx.AsyncClient(timeout=settings.http_timeout) as client:
        init_providers(client)
        logger.info("Providers initialized")

        start_scheduler()

        if settings.sync_on_startup:
            import asyncio

            asyncio.create_task(sync_all_mods())

        yield

        stop_scheduler()


api_app = FastAPI(title=f"{settings.app_name} API")
api_app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@api_app.get("/health")
async def health_check():
    return {"status": "ok"}


@api_app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {exc}"},
    )


from app.routers import mods, profiles, search, sync  # noqa: E402

api_app.include_router(profiles.router)
api_app.include_router(mods.router)
api_app.include_router(search.router)
api_app.include_router(sync.router)


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.mount(settings.api_prefix, api_app)

if (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")


def _resolve_frontend_file(path: str) -> Path | None:
    candidate = (FRONTEND_DIST / path).resolve()
    try:
        candidate.relative_to(FRONTEND_DIST.resolve())
    except ValueError:
        return None
    return candidate if candidate.is_file() else None


def _frontend_index() -> Path:
    index = FRONTEND_DIST / "index.html"
    if not index.is_file():
        raise HTTPException(
            status_code=404,
            detail="Frontend not built. Run `pnpm build` in frontend/.",
        )
    return index


@app.get("/", include_in_schema=False)
async def serve_spa_root():
    return FileResponse(_frontend_index())


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str):
    prefix = settings.api_prefix.strip("/")
    if full_path == prefix or full_path.startswith(f"{prefix}/"):
        raise HTTPException(status_code=404, detail="Not found")

    if full_path:
        file = _resolve_frontend_file(full_path)
        if file is not None:
            return FileResponse(file)

    return FileResponse(_frontend_index())
