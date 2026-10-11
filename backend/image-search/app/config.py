from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    image_search_internal_token: str = "change-me-internal-token"
    clip_model_name: str = "clip-ViT-B-32"
    clip_model_revision: str = "8a57575d58c05a79b9c4283ef8162cbdf2283548"
    clip_embedding_dim: int = 512
    model_version: str = "clip-vit-b-32-v1"
    huggingface_hub_cache: str = "/models"
    max_upload_bytes: int = 8 * 1024 * 1024
    max_image_pixels: int = 25_000_000
    image_search_stub: bool = False
    log_level: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()
