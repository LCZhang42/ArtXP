from collections.abc import AsyncIterator
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User


async def get_db(request: Request) -> AsyncIterator[AsyncSession]:
    async for session in request.app.state.database.sessions():
        yield session


DbSession = Annotated[AsyncSession, Depends(get_db)]


def session_serializer(request: Request) -> URLSafeTimedSerializer:
    settings = request.app.state.settings
    return URLSafeTimedSerializer(settings.session_secret, salt="artxp-web-session-v1")


async def get_current_user(request: Request, session: DbSession) -> User:
    settings = request.app.state.settings
    session_cookie = request.cookies.get(settings.session_cookie_name)
    if not session_cookie:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        user_id = UUID(
            session_serializer(request).loads(
                session_cookie, max_age=settings.session_max_age_seconds
            )
        )
    except (BadSignature, SignatureExpired, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session"
        ) from exc
    user = await session.get(User, user_id)
    if user is None or user.status != "active":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User unavailable")
    return user