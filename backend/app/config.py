from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    database_url: str = "postgresql+asyncpg://sukilo:sukilo@127.0.0.1:5432/sukilo"
    jwt_secret: str = "change-me-jwt-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    public_base_url: str = "http://127.0.0.1:8000"
    upload_dir: str = "/data/uploads"
    max_upload_bytes: int = 8 * 1024 * 1024
    max_image_pixels: int = 25_000_000
    # Legacy external embedding service settings. No longer required for the
    # model-free image search pipeline, but kept for backward compatibility.
    image_search_url: str = "http://127.0.0.1:8080"
    image_search_internal_token: str = "change-me-internal-token"
    image_search_timeout_seconds: float = 30.0
    clip_embedding_dim: int = 512

    # Model-free image feature extraction (phash + color histogram).
    model_version: str = "phash-color-v1"
    image_search_min_similarity: float = 0.35
    image_search_phash_weight: float = 0.7
    image_search_color_weight: float = 0.3
    admin_email: str = "admin@sukilo.local"
    admin_password: str = "changeme-admin"
    seed_demo: bool = False
    allowlisted_image_hosts: str = "127.0.0.1,localhost,backend,picsum.photos,fastly.picsum.photos"

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def sync_database_url(self) -> str:
        return self.database_url.replace("postgresql+asyncpg://", "postgresql://")


@lru_cache
def get_settings() -> Settings:
    return Settings()
