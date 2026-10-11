import asyncio

import redis.asyncio as redis
from fastapi import APIRouter, Request, Response, status
from sqlalchemy import text

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready")
async def readiness(request: Request, response: Response) -> dict:
    settings = request.app.state.settings
    checks: dict[str, str] = {}

    try:
        async with request.app.state.database.engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception:
        checks["database"] = "unavailable"

    if settings.infrastructure_required:
        redis_client = redis.from_url(settings.redis_url)
        try:
            await asyncio.wait_for(redis_client.ping(), timeout=2)
            checks["redis"] = "ok"
        except Exception:
            checks["redis"] = "unavailable"
        finally:
            await redis_client.aclose()

        try:
            await asyncio.to_thread(request.app.state.object_storage.assert_bucket_available)
            checks["object_storage"] = "ok"
        except Exception:
            checks["object_storage"] = "unavailable"

    is_ready = all(result == "ok" for result in checks.values())
    if not is_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {"status": "ready" if is_ready else "not_ready", "checks": checks}