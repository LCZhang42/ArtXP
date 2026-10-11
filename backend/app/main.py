from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.logging import configure_logging
from app.core.settings import Settings, get_settings
from app.db.session import Database
from app.middleware.request_id import RequestIdMiddleware
from app.storage.s3 import ObjectStorage


def create_app(settings: Settings | None = None) -> FastAPI:
    resolved_settings = settings or get_settings()
    configure_logging(resolved_settings.log_level)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        database = Database(resolved_settings.database_url)
        app.state.database = database
        app.state.object_storage = ObjectStorage(resolved_settings)
        if resolved_settings.auto_create_schema:
            await database.create_schema()
        yield
        await database.dispose()

    app = FastAPI(
        title="ArtXP API",
        version="0.1.0",
        description="Durable data and orchestration boundary for ArtXP.",
        lifespan=lifespan,
    )
    app.state.settings = resolved_settings
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=resolved_settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Idempotency-Key", "X-Request-ID"],
    )
    app.include_router(api_router, prefix=resolved_settings.api_prefix)
    return app


app = create_app()