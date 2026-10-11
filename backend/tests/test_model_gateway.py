import pytest

from app.core.settings import Settings
from app.model_gateway.openrouter import (
    GatewayResult,
    OpenRouterGateway,
    OpenRouterGatewayError,
)


class FakeModelGateway:
    def __init__(self) -> None:
        self.last_call = None
        self.error = None

    async def analyze_image(self, **kwargs):
        self.last_call = kwargs
        if self.error:
            raise self.error
        return GatewayResult(
            analysis={
                "summary": "A monochrome figure study.",
                "observations": [
                    {
                        "area": "composition",
                        "observation": "The subject is centered with clear negative space.",
                        "confidence": 0.91,
                    }
                ],
            },
            model="test/vision-model",
            usage={"prompt_tokens": 12, "completion_tokens": 18, "cost": 0.001},
            latency_ms=125,
        )


def install_gateway(client):
    gateway = FakeModelGateway()
    client.app.state.model_gateway = gateway
    return gateway


def test_vision_test_is_authenticated(client):
    response = client.post(
        "/api/v1/model-gateway/vision-test",
        headers={"X-OpenRouter-Key": "sk-or-test-key"},
        files={"image": ("study.png", b"image-bytes", "image/png")},
    )

    assert response.status_code == 401


def test_vision_test_is_ephemeral_and_does_not_echo_key(authenticated_client):
    gateway = install_gateway(authenticated_client)
    response = authenticated_client.post(
        "/api/v1/model-gateway/vision-test",
        headers={"X-OpenRouter-Key": "sk-or-test-key"},
        data={"model": "test/vision-model"},
        files={"image": ("study.png", b"image-bytes", "image/png")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["persisted"] is False
    assert payload["analysis"]["observations"][0]["area"] == "composition"
    assert payload["usage"]["cost"] == 0.001
    assert "sk-or-test-key" not in response.text
    assert gateway.last_call == {
        "api_key": "sk-or-test-key",
        "model": "test/vision-model",
        "image_bytes": b"image-bytes",
        "content_type": "image/png",
    }


def test_vision_test_rejects_unsupported_files(authenticated_client):
    install_gateway(authenticated_client)
    response = authenticated_client.post(
        "/api/v1/model-gateway/vision-test",
        headers={"X-OpenRouter-Key": "sk-or-test-key"},
        files={"image": ("notes.txt", b"not-an-image", "text/plain")},
    )

    assert response.status_code == 415


def test_vision_test_maps_upstream_errors(authenticated_client):
    gateway = install_gateway(authenticated_client)
    gateway.error = OpenRouterGatewayError("Invalid OpenRouter key", 502)
    response = authenticated_client.post(
        "/api/v1/model-gateway/vision-test",
        headers={"X-OpenRouter-Key": "sk-or-test-key"},
        files={"image": ("study.webp", b"image-bytes", "image/webp")},
    )

    assert response.status_code == 502
    assert response.json() == {"detail": "Invalid OpenRouter key"}

@pytest.mark.asyncio
async def test_gateway_never_passes_through_upstream_error_body(monkeypatch):
    secret = "sk-or-v1-super-secret-value"

    class FakeResponse:
        is_success = False
        status_code = 400

        def json(self):
            return {"error": {"message": f"request contained {secret}"}}

    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def post(self, *_args, **_kwargs):
            return FakeResponse()

    monkeypatch.setattr(
        "app.model_gateway.openrouter.httpx.AsyncClient",
        lambda **_kwargs: FakeClient(),
    )
    gateway = OpenRouterGateway(Settings(session_secret="test-secret"))

    with pytest.raises(OpenRouterGatewayError) as caught:
        await gateway.analyze_image(
            api_key=secret,
            model="test/vision-model",
            image_bytes=b"image-bytes",
            content_type="image/png",
        )

    assert str(caught.value) == "OpenRouter rejected the request (status 400)"
    assert secret not in str(caught.value)
