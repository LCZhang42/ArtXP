import asyncio
from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import delete, select

from app.api.dependencies import DbSession, get_current_user
from app.db.models import Artwork, ArtworkStatus, PracticeEntry, User

router = APIRouter()


class PracticeEntryCreate(BaseModel):
    artwork_id: UUID | None = None
    note: str = Field(default="", max_length=5000)
    exercise: str = Field(default="", max_length=255)
    skill: str = Field(min_length=1, max_length=64)
    practiced_at: datetime | None = None


class PracticeEntryResponse(BaseModel):
    id: UUID
    artwork_id: UUID | None
    note: str
    exercise: str
    skill: str
    xp_earned: int
    practiced_at: datetime
    image_url: str | None


CurrentUser = Annotated[User, Depends(get_current_user)]


async def serialize_entry(entry: PracticeEntry, request: Request) -> PracticeEntryResponse:
    image_url = None
    if entry.artwork is not None and entry.artwork.status == ArtworkStatus.UPLOADED:
        image_url = await asyncio.to_thread(
            request.app.state.object_storage.create_download_url,
            entry.artwork.object_key,
        )
    return PracticeEntryResponse(
        id=entry.id,
        artwork_id=entry.artwork_id,
        note=entry.note,
        exercise=entry.exercise,
        skill=entry.skill,
        xp_earned=entry.xp_earned,
        practiced_at=entry.practiced_at,
        image_url=image_url,
    )


@router.get("", response_model=list[PracticeEntryResponse])
async def list_entries(
    request: Request,
    user: CurrentUser,
    session: DbSession,
) -> list[PracticeEntryResponse]:
    entries = (
        await session.scalars(
            select(PracticeEntry)
            .where(PracticeEntry.user_id == user.id)
            .order_by(PracticeEntry.practiced_at.desc())
        )
    ).all()
    return [await serialize_entry(entry, request) for entry in entries]


@router.post("", response_model=PracticeEntryResponse, status_code=201)
async def create_entry(
    payload: PracticeEntryCreate,
    request: Request,
    user: CurrentUser,
    session: DbSession,
) -> PracticeEntryResponse:
    artwork = None
    if payload.artwork_id is not None:
        artwork = await session.scalar(
            select(Artwork).where(
                Artwork.id == payload.artwork_id,
                Artwork.owner_id == user.id,
                Artwork.status == ArtworkStatus.UPLOADED,
            )
        )
        if artwork is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Uploaded artwork not found",
            )

    entry = PracticeEntry(
        user_id=user.id,
        artwork_id=artwork.id if artwork else None,
        artwork=artwork,
        note=payload.note,
        exercise=payload.exercise,
        skill=payload.skill,
        practiced_at=payload.practiced_at or datetime.now(UTC),
    )
    session.add(entry)
    await session.commit()
    await session.refresh(entry)
    return await serialize_entry(entry, request)


@router.delete("", status_code=204)
async def delete_entries(
    request: Request,
    user: CurrentUser,
    session: DbSession,
) -> None:
    entries = (
        await session.scalars(
            select(PracticeEntry).where(PracticeEntry.user_id == user.id)
        )
    ).all()
    artworks = {
        entry.artwork.id: entry.artwork
        for entry in entries
        if entry.artwork is not None
    }
    for artwork in artworks.values():
        if artwork.status == ArtworkStatus.UPLOADED:
            await asyncio.to_thread(
                request.app.state.object_storage.delete,
                artwork.object_key,
            )
        artwork.status = ArtworkStatus.DELETED
        artwork.deleted_at = datetime.now(UTC)
    await session.execute(
        delete(PracticeEntry).where(PracticeEntry.user_id == user.id)
    )
    await session.commit()
