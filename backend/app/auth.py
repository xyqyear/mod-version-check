import secrets

from fastapi import HTTPException, Request

from app.config import settings


async def require_auth(request: Request) -> None:
    if not settings.auth_token:
        return

    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = header.removeprefix("Bearer ")
    if not secrets.compare_digest(token, settings.auth_token):
        raise HTTPException(status_code=401, detail="Invalid token")
