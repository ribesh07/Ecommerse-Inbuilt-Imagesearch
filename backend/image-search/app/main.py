from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from .config import Settings, get_settings
from .encoder import ImageEncoder, create_encoder, l2_normalize
from .images import decode_image
from .security import require_internal_token

logger = logging.getLogger("image_search")
logging.basicConfig(level=logging.INFO)


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: str
    embedding_dim: int
    stub: bool


class EmbedResponse(BaseModel):
    embedding: list[float] = Field(min_length=1)
    dim: int
    model_version: str
    l2_norm: float


class AppState:
    encoder: ImageEncoder | None = None


state = AppState()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    logging.getLogger().setLevel(settings.log_level.upper())
    state.encoder = create_encoder(settings)
    logger.info("Encoder ready version=%s dim=%s", state.encoder.model_version, state.encoder.dim)
    yield
    state.encoder = None


app = FastAPI(
    title="Sukilo CLIP Embedding Service",
    version="1.0.0",
    description="Internal image embedding API. Not intended for public browser access.",
    lifespan=lifespan,
)


def get_encoder() -> ImageEncoder:
    if state.encoder is None:
        raise HTTPException(status_code=503, detail="Embedding model is not loaded")
    return state.encoder


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health(settings: Annotated[Settings, Depends(get_settings)]) -> HealthResponse:
    encoder = state.encoder
    return HealthResponse(
        status="ok" if encoder is not None else "starting",
        model_loaded=encoder is not None,
        model_version=encoder.model_version if encoder else settings.model_version,
        embedding_dim=settings.clip_embedding_dim,
        stub=settings.image_search_stub or (encoder is not None and encoder.model_version.endswith("-stub")),
    )


@app.post(
    "/embed",
    response_model=EmbedResponse,
    tags=["Embeddings"],
    dependencies=[Depends(require_internal_token)],
)
async def embed_image(
    file: Annotated[UploadFile, File(description="JPEG, PNG, or WebP image")],
    settings: Annotated[Settings, Depends(get_settings)],
    encoder: Annotated[ImageEncoder, Depends(get_encoder)],
) -> EmbedResponse:
    data = await file.read(settings.max_upload_bytes + 1)
    image = decode_image(
        data,
        file.content_type,
        settings.max_upload_bytes,
        settings.max_image_pixels,
    )
    try:
        vector = encoder.embed(image)
        vector = l2_normalize(vector)
    except Exception:
        logger.exception("Embedding failed")
        raise HTTPException(status_code=500, detail="Failed to generate image embedding") from None
    if vector.shape[0] != settings.clip_embedding_dim and not encoder.model_version.endswith("-stub"):
        raise HTTPException(status_code=500, detail="Embedding dimension mismatch")
    return EmbedResponse(
        embedding=vector.tolist(),
        dim=int(vector.shape[0]),
        model_version=encoder.model_version,
        l2_norm=float((vector**2).sum() ** 0.5),
    )
