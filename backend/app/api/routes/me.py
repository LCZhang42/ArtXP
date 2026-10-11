from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field

from app.api.dependencies import DbSession, get_current_user
from app.db.models import User, UserProfile

router = APIRouter()


class ProfilePatch(BaseModel):
    goal: str | None = Field(default=None, max_length=500)
    goal_id: str | None = Field(default=None, max_length=64)
    goal_emoji: str | None = Field(default=None, max_length=16)
    self_reported_level: str | None = Field(default=None, max_length=32)
    daily_minutes: int | None = Field(default=None, ge=5, le=480)
    medium_preferences: list[str] | None = None
    style_preferences: list[str] | None = None


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    goal: str | None
    goal_id: str | None
    goal_emoji: str | None
    self_reported_level: str | None
    daily_minutes: int | None
    medium_preferences: list[str]
    style_preferences: list[str]


class MeResponse(BaseModel):
    id: str
    email: str
    locale: str
    timezone: str
    created_at: datetime
    profile: ProfileResponse


CurrentUser = Annotated[User, Depends(get_current_user)]


def serialize_user(user: User) -> MeResponse:
    profile = user.profile or UserProfile(user_id=user.id)
    return MeResponse(
        id=str(user.id),
        email=user.email,
        locale=user.locale,
        timezone=user.timezone,
        created_at=user.created_at.isoformat(),
        profile=ProfileResponse.model_validate(profile),
    )


@router.get("")
async def get_me(user: CurrentUser) -> MeResponse:
    return serialize_user(user)


@router.patch("/profile")
async def update_profile(
    payload: ProfilePatch,
    user: CurrentUser,
    session: DbSession,
) -> MeResponse:
    if user.profile is None:
        user.profile = UserProfile()
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user.profile, field, value)
    await session.commit()
    await session.refresh(user, attribute_names=["profile"])
    return serialize_user(user)
