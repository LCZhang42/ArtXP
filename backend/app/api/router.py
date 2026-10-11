from fastapi import APIRouter

from app.api.routes import artworks, auth, health, me

api_router = APIRouter()
api_router.include_router(health.router, tags=["system"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(me.router, prefix="/me", tags=["me"])
api_router.include_router(artworks.router, prefix="/artworks", tags=["artworks"])