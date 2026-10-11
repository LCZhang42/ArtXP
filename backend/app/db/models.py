from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import (
    JSON,
    BigInteger,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class ArtworkStatus(StrEnum):
    PENDING_UPLOAD = "pending_upload"
    UPLOADED = "uploaded"
    DELETED = "deleted"


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint(
            "identity_provider",
            "external_subject",
            name="uq_users_identity_provider_subject",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    identity_provider: Mapped[str | None] = mapped_column(String(512))
    external_subject: Mapped[str | None] = mapped_column(String(512))
    status: Mapped[str] = mapped_column(String(32), default="active")
    locale: Mapped[str] = mapped_column(String(16), default="en")
    timezone: Mapped[str] = mapped_column(String(64), default="UTC")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    profile: Mapped["UserProfile | None"] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
        lazy="selectin",
    )


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    goal: Mapped[str | None] = mapped_column(String(500))
    goal_id: Mapped[str | None] = mapped_column(String(64))
    goal_emoji: Mapped[str | None] = mapped_column(String(16))
    self_reported_level: Mapped[str | None] = mapped_column(String(32))
    daily_minutes: Mapped[int | None]
    medium_preferences: Mapped[list[str]] = mapped_column(JSON, default=list)
    style_preferences: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    user: Mapped[User] = relationship(back_populates="profile")


class Artwork(Base):
    __tablename__ = "artworks"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    owner_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("users.id"), index=True)
    object_key: Mapped[str] = mapped_column(String(1024), unique=True)
    original_filename: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(64))
    size_bytes: Mapped[int] = mapped_column(BigInteger)
    sha256: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[str] = mapped_column(String(32), default=ArtworkStatus.PENDING_UPLOAD)
    context: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    uploaded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class PracticeEntry(Base):
    __tablename__ = "practice_entries"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("users.id"), index=True)
    artwork_id: Mapped[UUID | None] = mapped_column(
        Uuid, ForeignKey("artworks.id"), nullable=True, index=True
    )
    note: Mapped[str] = mapped_column(Text, default="")
    exercise: Mapped[str] = mapped_column(String(255), default="")
    skill: Mapped[str] = mapped_column(String(64))
    xp_earned: Mapped[int] = mapped_column(Integer, default=30)
    practiced_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    artwork: Mapped[Artwork | None] = relationship(lazy="selectin")
