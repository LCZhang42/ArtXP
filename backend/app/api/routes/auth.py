from typing import Any

from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.api.dependencies import DbSession, session_serializer
from app.db.models import User, UserProfile

router = APIRouter()


class DevSessionRequest(BaseModel):
    email: str = Field(
        default="developer@artxp.local",
        min_length=3,
        max_length=320,
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
    )


def set_session_cookie(request: Request, response: Response, user: User) -> None:
    settings = request.app.state.settings
    token = session_serializer(request).dumps(str(user.id))
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=settings.session_max_age_seconds,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="lax",
        path="/",
    )


def create_oidc_client(request: Request):
    settings = request.app.state.settings
    if not settings.oidc_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Production identity provider is not configured",
        )
    oauth = OAuth()
    oauth.register(
        name="identity",
        server_metadata_url=(
            f"{settings.oidc_issuer_url.rstrip('/')}/.well-known/openid-configuration"
        ),
        client_id=settings.oidc_client_id,
        client_secret=settings.oidc_client_secret,
        client_kwargs={
            "scope": "openid email profile",
            "code_challenge_method": "S256",
        },
    )
    return oauth.create_client("identity")


@router.get("/login")
async def oidc_login(request: Request):
    client = create_oidc_client(request)
    settings = request.app.state.settings
    redirect_uri = settings.oidc_redirect_uri or str(request.url_for("oidc_callback"))
    return await client.authorize_redirect(request, redirect_uri)


@router.get("/callback", name="oidc_callback")
async def oidc_callback(request: Request, session: DbSession):
    client = create_oidc_client(request)
    token = await client.authorize_access_token(request)
    userinfo: dict[str, Any] | None = token.get("userinfo")
    if not userinfo:
        userinfo = dict(await client.userinfo(token=token))

    subject = userinfo.get("sub")
    email = userinfo.get("email")
    if not subject or not email:
        raise HTTPException(status_code=400, detail="OIDC identity is missing sub or email")
    if userinfo.get("email_verified") is not True:
        raise HTTPException(status_code=403, detail="A verified email is required")

    issuer = request.app.state.settings.oidc_issuer_url
    user = await session.scalar(
        select(User).where(
            (User.identity_provider == issuer) & (User.external_subject == subject)
        )
    )
    if user is None:
        email_user = await session.scalar(select(User).where(User.email == email))
        if email_user is not None and (
            email_user.identity_provider is not None
            or email_user.external_subject is not None
        ):
            raise HTTPException(status_code=409, detail="Email is linked to another identity")
        user = email_user
    if user is None:
        user = User(
            email=email,
            identity_provider=issuer,
            external_subject=subject,
            profile=UserProfile(),
        )
        session.add(user)
    else:
        user.identity_provider = issuer
        user.external_subject = subject
        user.status = "active"
    await session.commit()
    await session.refresh(user)

    response = RedirectResponse(request.app.state.settings.frontend_url)
    set_session_cookie(request, response, user)
    return response


@router.post("/dev-session", status_code=status.HTTP_204_NO_CONTENT)
async def create_development_session(
    request: Request,
    response: Response,
    session: DbSession,
    payload: DevSessionRequest | None = None,
) -> None:
    settings = request.app.state.settings
    if settings.environment != "development":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    email = payload.email if payload else "developer@artxp.local"
    user = await session.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(email=email, profile=UserProfile())
        session.add(user)
        await session.commit()
        await session.refresh(user)

    set_session_cookie(request, response, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, response: Response) -> None:
    request.session.clear()
    response.delete_cookie(request.app.state.settings.session_cookie_name, path="/")
