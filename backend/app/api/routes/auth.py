from fastapi import APIRouter, HTTPException, Request, Response, status
from sqlalchemy import select

from app.api.dependencies import DbSession, session_serializer
from app.db.models import User, UserProfile

router = APIRouter()


@router.post("/dev-session", status_code=status.HTTP_204_NO_CONTENT)
async def create_development_session(
    request: Request,
    response: Response,
    session: DbSession,
) -> None:
    settings = request.app.state.settings
    if settings.environment != "development":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    user = await session.scalar(select(User).where(User.email == "developer@artxp.local"))
    if user is None:
        user = User(email="developer@artxp.local", profile=UserProfile())
        session.add(user)
        await session.commit()
        await session.refresh(user)

    token = session_serializer(request).dumps(str(user.id))
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=settings.session_max_age_seconds,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, response: Response) -> None:
    response.delete_cookie(request.app.state.settings.session_cookie_name, path="/")