import base64
import json
from dataclasses import dataclass
from time import perf_counter
from typing import Any

import httpx

from app.core.settings import Settings

VISION_RESULT_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {"type": "string"},
        "observations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "area": {
                        "type": "string",
                        "enum": [
                            "anatomy",
                            "composition",
                            "lighting",
                            "color",
                            "other",
                        ],
                    },
                    "observation": {"type": "string"},
                    "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                },
                "required": ["area", "observation", "confidence"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["summary", "observations"],
    "additionalProperties": False,
}


@dataclass
class GatewayResult:
    analysis: dict[str, Any]
    model: str
    usage: dict[str, Any]
    latency_ms: int


class OpenRouterGatewayError(Exception):
    def __init__(self, message: str, status_code: int = 502) -> None:
        super().__init__(message)
        self.status_code = status_code


class OpenRouterGateway:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def analyze_image(
        self,
        *,
        api_key: str,
        model: str,
        image_bytes: bytes,
        content_type: str,
    ) -> GatewayResult:
        encoded = base64.b64encode(image_bytes).decode("ascii")
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are testing image-understanding for an art learning app. "
                        "Describe only visible evidence. Do not infer the artist's identity, "
                        "age, health, personality, or intent."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Give a brief neutral visual summary and up to four useful "
                                "observations categorized as anatomy, composition, lighting, "
                                "color, or other. This is a connectivity test, not a full critique."
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{content_type};base64,{encoded}",
                            },
                        },
                    ],
                },
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "artxp_vision_test",
                    "strict": True,
                    "schema": VISION_RESULT_SCHEMA,
                },
            },
            "provider": {"require_parameters": True},
            "temperature": 0.2,
            "max_tokens": 800,
        }
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": self.settings.frontend_url,
            "X-OpenRouter-Title": "ArtXP",
        }
        started = perf_counter()
        try:
            async with httpx.AsyncClient(
                timeout=self.settings.openrouter_timeout_seconds
            ) as client:
                response = await client.post(
                    f"{self.settings.openrouter_base_url.rstrip('/')}/chat/completions",
                    headers=headers,
                    json=payload,
                )
        except httpx.TimeoutException as exc:
            raise OpenRouterGatewayError("OpenRouter request timed out", 504) from exc
        except httpx.RequestError as exc:
            raise OpenRouterGatewayError("Could not reach OpenRouter") from exc

        if not response.is_success:
            safe_messages = {
                401: "OpenRouter rejected the API key",
                402: "The OpenRouter account has insufficient credits",
                429: "OpenRouter rate limit reached; try again later",
            }
            message = safe_messages.get(
                response.status_code,
                f"OpenRouter rejected the request (status {response.status_code})",
            )
            raise OpenRouterGatewayError(message, 502)

        try:
            body = response.json()
            content = body["choices"][0]["message"]["content"]
            analysis = json.loads(content) if isinstance(content, str) else content
            if not isinstance(analysis, dict):
                raise TypeError("Structured response is not an object")
        except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
            raise OpenRouterGatewayError(
                "OpenRouter returned an invalid structured response"
            ) from exc

        return GatewayResult(
            analysis=analysis,
            model=body.get("model") or model,
            usage=body.get("usage") or {},
            latency_ms=round((perf_counter() - started) * 1000),
        )
