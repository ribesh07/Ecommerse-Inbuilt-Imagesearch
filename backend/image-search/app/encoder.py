from __future__ import annotations

import hashlib
import logging
from abc import ABC, abstractmethod

import numpy as np
from PIL import Image

from .config import Settings

logger = logging.getLogger(__name__)


def l2_normalize(vector: np.ndarray) -> np.ndarray:
    arr = np.asarray(vector, dtype=np.float32).reshape(-1)
    norm = np.linalg.norm(arr)
    if norm == 0:
        raise ValueError("Cannot normalize a zero embedding")
    return arr / norm


class ImageEncoder(ABC):
    dim: int
    model_version: str

    @abstractmethod
    def embed(self, image: Image.Image) -> np.ndarray:
        raise NotImplementedError


class StubEncoder(ImageEncoder):
    """Deterministic stand-in used in tests and when CLIP weights are unavailable."""

    def __init__(self, settings: Settings) -> None:
        self.dim = settings.clip_embedding_dim
        self.model_version = f"{settings.model_version}-stub"
        self._settings_version = settings.model_version

    def embed(self, image: Image.Image) -> np.ndarray:
        raw = np.asarray(image.resize((32, 32)), dtype=np.float32).tobytes()
        digest = hashlib.sha256(raw).digest()
        seed = int.from_bytes(digest[:8], "big") % (2**32)
        rng = np.random.default_rng(seed)
        vector = rng.standard_normal(self.dim, dtype=np.float32)
        return l2_normalize(vector)


class ClipEncoder(ImageEncoder):
    def __init__(self, settings: Settings) -> None:
        from sentence_transformers import SentenceTransformer

        self.dim = settings.clip_embedding_dim
        self.model_version = settings.model_version
        logger.info(
            "Loading CLIP model %s revision %s",
            settings.clip_model_name,
            settings.clip_model_revision,
        )
        self._model = SentenceTransformer(
            settings.clip_model_name,
            revision=settings.clip_model_revision,
            device="cpu",
            cache_folder=settings.huggingface_hub_cache,
        )

    def embed(self, image: Image.Image) -> np.ndarray:
        vector = self._model.encode(
            image,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        normalized = l2_normalize(vector)
        if normalized.shape[0] != self.dim:
            raise RuntimeError(
                f"Embedding dim {normalized.shape[0]} does not match configured {self.dim}"
            )
        return normalized


def create_encoder(settings: Settings) -> ImageEncoder:
    if settings.image_search_stub:
        logger.warning("IMAGE_SEARCH_STUB is enabled; embeddings are not CLIP-compatible")
        return StubEncoder(settings)
    try:
        return ClipEncoder(settings)
    except Exception:
        logger.exception("Failed to load CLIP; falling back to stub encoder")
        encoder = StubEncoder(settings)
        encoder.model_version = f"{settings.model_version}-stub"
        return encoder
