from typing import Annotated, Any, Literal

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    Header,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from pydantic import BaseModel, Field, ValidationError

from app.api.dependencies import get_current_user
from app.db.models import User
from app.model_gateway.openrouter import OpenRouterGatewayError

router = APIRouter()


class VisionObservation(BaseModel):
    area: Literal["anatomy", "composition", "lighting", "color", "other"]
    observation: str
    confidence: float = Field(ge=0, le=1)


class VisionAnalysis(BaseModel):
    summary: str
    observations: list[VisionObservation] = Field(max_length=4)


class VisionTestResponse(BaseModel):
    analysis: VisionAnalysis
    model: str
    usage: dict[str, Any]
    latency_ms: int
    persisted: bool = False


@router.post("/vision-test", response_model=VisionTestResponse)
async def test_vision(
    request: Request,
    user: Annotated[User, Depends(get_current_user)],
    image: Annotated[UploadFile, File(description="One JPEG, PNG, or WebP image")],
    api_key: Annotated[str, Header(alias="X-OpenRouter-Key", min_length=10)],
    model: Annotated[str | None, Form(max_length=200)] = None,
) -> VisionTestResponse:
    del user
    content_type = image.content_type or ""
    if content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only JPEG, PNG, and WebP images are supported",
        )

    settings = request.app.state.settings
    image_bytes = await image.read(settings.vision_test_max_upload_bytes + 1)
    if not image_bytes:
        raise HTTPException(status_code=422, detail="Image is empty")
    if len(image_bytes) > settings.vision_test_max_upload_bytes:
        raise HTTPException(status_code=413, detail="Vision test image is too large")

    selected_model = model or settings.openrouter_vision_model
    try:
        result = await request.app.state.model_gateway.analyze_image(
            api_key=api_key.strip(),
            model=selected_model,
            image_bytes=image_bytes,
            content_type=content_type,
        )
        analysis = VisionAnalysis.model_validate(result.analysis)
    except OpenRouterGatewayError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    except ValidationError as exc:
        raise HTTPException(
            status_code=502,
            detail="OpenRouter response did not match the vision-test schema",
        ) from exc

    return VisionTestResponse(
        analysis=analysis,
        model=result.model,
        usage=result.usage,
        latency_ms=result.latency_ms,
    )