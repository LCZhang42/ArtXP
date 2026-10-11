import asyncio
import re
from datetime import UTC, datetime
from pathlib import Path
from typing import Annotated, Any, Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import DbSession, get_current_user
from app.db.models import Artwork, ArtworkStatus, User

router = APIRouter()
ALLOWED_CONTENT_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


class UploadIntentRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    content_type: Literal["image/jpeg", "image/png", "image/webp"]
    size_bytes: int = Field(gt=0)
    sha256: str = Field(pattern=r"^[a-fA-F0-9]{64}$")
    context: dict[str, Any] = Field(default_factory=dict)


class UploadIntentResponse(BaseModel):
    artwork_id: UUID
    upload_url: str
    method: str = "PUT"
    headers: dict[str, str]
    expires_in_seconds: int


class ArtworkResponse(BaseModel):
    id: UUID
    filename: str
    content_type: str
    size_bytes: int
    sha256: str
    status: str
    context: dict[str, Any]
    download_url: str | None = None


CurrentUser = Annotated[User, Depends(get_current_user)]


async def owned_artwork(artwork_id: UUID, user: User, session: AsyncSession) -> Artwork:
    artwork = await session.scalar(
        select(Artwork).where(
            Artwork.id == artwork_id,
            Artwork.owner_id == user.id,
            Artwork.status != ArtworkStatus.DELETED,
        )
    )
    if artwork is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artwork not found")
    return artwork


@router.post("/upload-intents", response_model=UploadIntentResponse, status_code=201)
async def create_upload_intent(
    payload: UploadIntentRequest,
    request: Request,
    user: CurrentUser,
    session: DbSession,
) -> UploadIntentResponse:
    settings = request.app.state.settings
    if payload.size_bytes > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="Image exceeds the 20 MB upload limit")
    extension = ALLOWED_CONTENT_TYPES[payload.content_type]
    safe_stem = re.sub(r"[^a-zA-Z0-9_-]+", "-", Path(payload.filename).stem)[:80] or "artwork"
    artwork_id = uuid4()
    object_key = f"users/{user.id}/artworks/{artwork_id}/{safe_stem}{extension}"
    artwork = Artwork(
        id=artwork_id,
        owner_id=user.id,
        object_key=object_key,
        original_filename=payload.filename,
        content_type=payload.content_type,
        size_bytes=payload.size_bytes,
        sha256=payload.sha256.lower(),
        context=payload.context,
    )
    session.add(artwork)
    await session.commit()
    upload_url = await asyncio.to_thread(
        request.app.state.object_storage.create_upload_url, object_key, payload.content_type
    )
    return UploadIntentResponse(
        artwork_id=artwork.id,
        upload_url=upload_url,
        headers={"Content-Type": payload.content_type},
        expires_in_seconds=settings.upload_url_ttl_seconds,
    )


@router.post("/{artwork_id}/complete-upload", response_model=ArtworkResponse)
async def complete_upload(
    artwork_id: UUID,
    request: Request,
    user: CurrentUser,
    session: DbSession,
) -> ArtworkResponse:
    artwork = await owned_artwork(artwork_id, user, session)
    metadata = await asyncio.to_thread(request.app.state.object_storage.head, artwork.object_key)
    if metadata.get("ContentLength") != artwork.size_bytes:
        raise HTTPException(status_code=422, detail="Uploaded object size does not match intent")
    actual_type = metadata.get("ContentType")
    if actual_type and actual_type != artwork.content_type:
        raise HTTPException(status_code=422, detail="Uploaded object type does not match intent")
    artwork.status = ArtworkStatus.UPLOADED
    artwork.uploaded_at = datetime.now(UTC)
    await session.commit()
    return serialize_artwork(artwork)


@router.get("/{artwork_id}", response_model=ArtworkResponse)
async def get_artwork(
    artwork_id: UUID,
    request: Request,
    user: CurrentUser,
    session: DbSession,
) -> ArtworkResponse:
    artwork = await owned_artwork(artwork_id, user, session)
    download_url = None
    if artwork.status == ArtworkStatus.UPLOADED:
        download_url = await asyncio.to_thread(
            request.app.state.object_storage.create_download_url, artwork.object_key
        )
    return serialize_artwork(artwork, download_url)


@router.delete("/{artwork_id}", status_code=204)
async def delete_artwork(
    artwork_id: UUID,
    request: Request,
    user: CurrentUser,
    session: DbSession,
) -> None:
    artwork = await owned_artwork(artwork_id, user, session)
    if artwork.status == ArtworkStatus.UPLOADED:
        await asyncio.to_thread(request.app.state.object_storage.delete, artwork.object_key)
    artwork.status = ArtworkStatus.DELETED
    artwork.deleted_at = datetime.now(UTC)
    await session.commit()


def serialize_artwork(artwork: Artwork, download_url: str | None = None) -> ArtworkResponse:
    return ArtworkResponse(
        id=artwork.id,
        filename=artwork.original_filename,
        content_type=artwork.content_type,
        size_bytes=artwork.size_bytes,
        sha256=artwork.sha256,
        status=artwork.status,
        context=artwork.context,
        download_url=download_url,
    )