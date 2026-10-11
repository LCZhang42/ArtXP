from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="ARTXP_",
        env_file=".env",
        extra="ignore",
    )

    environment: str = "development"
    api_prefix: str = "/api/v1"
    frontend_url: str = "http://localhost:5173"
    log_level: str = "INFO"
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"]
    )
    session_secret: str = "local-development-secret-change-me"
    session_cookie_name: str = "artxp_session"
    session_cookie_secure: bool = False
    session_max_age_seconds: int = 60 * 60 * 24 * 30

    oidc_issuer_url: str | None = None
    oidc_client_id: str | None = None
    oidc_client_secret: str | None = None
    oidc_redirect_uri: str | None = None

    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_vision_model: str = "google/gemini-3.8-flash"
    openrouter_timeout_seconds: float = 60.0
    vision_test_max_upload_bytes: int = 8 * 1024 * 1024

    database_url: str = "sqlite+aiosqlite:///./artxp.db"
    redis_url: str = "redis://localhost:6379/0"
    s3_endpoint_url: str = "http://localhost:9000"
    s3_public_endpoint_url: str = "http://localhost:9000"
    s3_access_key: str = "artxp"
    s3_secret_key: str = "artxp-development-only"
    s3_bucket: str = "artxp-artworks"
    s3_region: str = "us-east-1"
    upload_url_ttl_seconds: int = 600
    download_url_ttl_seconds: int = 300
    max_upload_bytes: int = 20 * 1024 * 1024
    infrastructure_required: bool = False
    auto_create_schema: bool = True

    @property
    def oidc_configured(self) -> bool:
        return all(
            [self.oidc_issuer_url, self.oidc_client_id, self.oidc_client_secret]
        )

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.environment == "production":
            if "change-me" in self.session_secret:
                raise ValueError("ARTXP_SESSION_SECRET must be replaced in production")
            if not self.session_cookie_secure:
                raise ValueError("ARTXP_SESSION_COOKIE_SECURE must be true in production")
            if not self.oidc_configured:
                raise ValueError("OIDC settings are required in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
