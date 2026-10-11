from __future__ import annotations

import logging

import httpx
from fastapi import HTTPException

from .config import get_settings

logger = logging.getLogger(__name__)


class EmbedResult:
    def __init__(self, embedding: list[float], model_version: str, dim: int):
        self.embedding = embedding
        self.model_version = model_version
        self.dim = dim


class EmbeddingServiceError(Exception):
    def __init__(self, message: str, status_code: int = 503):
        super().__init__(message)
        self.status_code = status_code


async def embed_bytes(data: bytes, filename: str = "query.jpg", content_type: str = "image/jpeg") -> EmbedResult:
    settings = get_settings()
    url = f"{settings.image_search_url.rstrip('/')}/embed"
    try:
        async with httpx.AsyncClient(timeout=settings.image_search_timeout_seconds) as client:
            response = await client.post(
                url,
                headers={"X-Internal-Token": settings.image_search_internal_token},
                files={"file": (filename, data, content_type)},
            )
    except httpx.TimeoutException as exc:
        raise EmbeddingServiceError("Image embedding timed out") from exc
    except httpx.HTTPError as exc:
        raise EmbeddingServiceError("Image embedding service is unavailable") from exc

    if response.status_code in (400, 413):
        detail = response.json().get("detail") if response.headers.get("content-type", "").startswith("application/json") else "Invalid image"
        raise HTTPException(status_code=response.status_code, detail=detail)
    if response.status_code == 401:
        logger.error("Embedding service rejected internal credentials")
        raise EmbeddingServiceError("Image embedding service rejected authentication")
    if response.status_code >= 400:
        raise EmbeddingServiceError("Image embedding failed")

    body = response.json()
    embedding = body.get("embedding") or []
    dim = int(body.get("dim") or len(embedding))
    if dim != settings.clip_embedding_dim:
        raise EmbeddingServiceError("Embedding dimension mismatch")
    return EmbedResult(embedding=embedding, model_version=body.get("model_version") or settings.model_version, dim=dim)
