"""Model-free image feature extraction and similarity.

This module provides a lightweight, dependency-free (no ML models) approach to
image similarity using:
- Pillow for safe image loading, EXIF orientation correction, and RGB conversion
- ImageHash for perceptual hashing (pHash)
- NumPy for normalized RGB color histograms

The resulting features are stored as a serializable dict and combined into a
single 0..1 similarity score.

Limitations:
- This finds visually similar images, similar colors, and near-duplicates.
- It does NOT understand product semantics (e.g. "a red shoe" vs "a red cup")
  the way a trained embedding model (CLIP, ResNet) would.
"""

from __future__ import annotations

import io
import logging
from dataclasses import dataclass

import imagehash
import numpy as np
from PIL import Image, ImageFile, UnidentifiedImageError

logger = logging.getLogger(__name__)

# Allow Pillow to load truncated images but keep the safety limit on pixel count.
ImageFile.LOAD_TRUNCATED_IMAGES = True

SUPPORTED_FORMATS = {"JPEG", "PNG", "WEBP"}

# Default similarity weights. Can be overridden via compute_similarity params.
DEFAULT_PHASH_WEIGHT = 0.7
DEFAULT_COLOR_WEIGHT = 0.3

# Number of bins per color channel for the histogram.
HISTOGRAM_BINS = 16


class ImageFeatureError(Exception):
    """Raised when image bytes cannot be parsed into features."""


@dataclass
class ImageFeatures:
    """Serializable image features.

    Attributes:
        phash: Perceptual hash as a hex string (ImageHash.phash).
        histogram: Normalized RGB histogram flattened to a list of floats
            (length = HISTOGRAM_BINS * 3). Each channel is normalized to sum to 1.
        width: Original image width after orientation correction.
        height: Original image height after orientation correction.
    """

    phash: str
    histogram: list[float]
    width: int
    height: int

    def to_dict(self) -> dict:
        return {
            "phash": self.phash,
            "histogram": self.histogram,
            "width": self.width,
            "height": self.height,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "ImageFeatures":
        return cls(
            phash=str(data["phash"]),
            histogram=[float(v) for v in data["histogram"]],
            width=int(data.get("width", 0)),
            height=int(data.get("height", 0)),
        )


def _apply_exif_orientation(image: Image.Image) -> Image.Image:
    """Apply EXIF orientation tag so the image is upright before hashing."""
    try:
        exif = image.getexif()
    except Exception:
        return image
    if not exif:
        return image
    orientation = exif.get(0x0112)
    # Pillow constants for Transpose
    from PIL import ImageOps

    orientation_map = {
        2: ImageOps.mirror,
        3: ImageOps.flip,
        4: lambda im: ImageOps.mirror(ImageOps.flip(im)),
        5: lambda im: ImageOps.mirror(im.transpose(Image.Transpose.ROTATE_90)),
        6: lambda im: im.transpose(Image.Transpose.ROTATE_270),
        7: lambda im: ImageOps.mirror(im.transpose(Image.Transpose.ROTATE_270)),
        8: lambda im: im.transpose(Image.Transpose.ROTATE_90),
    }
    func = orientation_map.get(orientation)
    if func is None:
        return image
    try:
        return func(image)
    except Exception:
        return image


def extract_features(data: bytes, *, max_pixels: int = 25_000_000) -> ImageFeatures:
    """Extract perceptual hash + color histogram from raw image bytes.

    Args:
        data: Raw image bytes (JPEG/PNG/WebP).
        max_pixels: Maximum allowed pixel count (safety limit).

    Returns:
        ImageFeatures with phash and normalized histogram.

    Raises:
        ImageFeatureError: If the data is not a valid or supported image.
    """
    if not data:
        raise ImageFeatureError("Empty image data")
    try:
        with Image.open(io.BytesIO(data)) as probe:
            probe.verify()
    except Image.DecompressionBombError as exc:
        raise ImageFeatureError("Image pixel count exceeds the safety limit") from exc
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise ImageFeatureError("File is not a valid image") from exc

    try:
        image = Image.open(io.BytesIO(data))
        image.load()
    except Exception as exc:
        raise ImageFeatureError("Unable to decode image") from exc

    if image.format not in SUPPORTED_FORMATS:
        raise ImageFeatureError(f"Unsupported image format: {image.format}")

    width, height = image.size
    if width * height > max_pixels:
        raise ImageFeatureError("Image pixel count exceeds the safety limit")

    # EXIF orientation then RGB conversion.
    image = _apply_exif_orientation(image)
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Perceptual hash. ImageHash.phash returns a 64-bit hash by default.
    try:
        phash = str(imagehash.phash(image))
    except Exception as exc:
        raise ImageFeatureError("Failed to compute perceptual hash") from exc

    # Normalized RGB histogram.
    try:
        arr = np.asarray(image, dtype=np.uint8)
        r_hist, _ = np.histogram(arr[..., 0], bins=HISTOGRAM_BINS, range=(0, 256))
        g_hist, _ = np.histogram(arr[..., 1], bins=HISTOGRAM_BINS, range=(0, 256))
        b_hist, _ = np.histogram(arr[..., 2], bins=HISTOGRAM_BINS, range=(0, 256))
        total = max(arr.shape[0] * arr.shape[1], 1)
        histogram = np.concatenate([r_hist, g_hist, b_hist]).astype(np.float64) / total
    except Exception as exc:
        raise ImageFeatureError("Failed to compute color histogram") from exc

    return ImageFeatures(
        phash=phash,
        histogram=histogram.tolist(),
        width=image.size[0],
        height=image.size[1],
    )


def _phash_similarity(a: str, b: str) -> float:
    """Similarity between two perceptual hashes as a 0..1 value.

    Uses Hamming distance normalized by the hash length (64 bits for default
    ImageHash phash). Identical hashes -> 1.0, maximally different -> 0.0.
    """
    if not a or not b:
        return 0.0
    try:
        ha = imagehash.hex_to_hash(a)
        hb = imagehash.hex_to_hash(b)
    except Exception:
        return 0.0
    # hamming distance is an int; default phash is 64 bits.
    bits = len(ha.hash) * len(ha.hash[0]) if hasattr(ha, "hash") else 64
    bits = max(bits, 1)
    distance = ha - hb
    return max(0.0, 1.0 - float(distance) / float(bits))


def _histogram_correlation(a: list[float], b: list[float]) -> float:
    """Cosine similarity between two normalized histograms, mapped to 0..1."""
    if not a or not b or len(a) != len(b):
        return 0.0
    va = np.asarray(a, dtype=np.float64)
    vb = np.asarray(b, dtype=np.float64)
    norm_a = np.linalg.norm(va)
    norm_b = np.linalg.norm(vb)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    cosine = float(np.dot(va, vb) / (norm_a * norm_b))
    # Cosine ranges from -1..1; map to 0..1.
    return max(0.0, min(1.0, (cosine + 1.0) / 2.0))


def compute_similarity(
    a: ImageFeatures | dict,
    b: ImageFeatures | dict,
    *,
    phash_weight: float = DEFAULT_PHASH_WEIGHT,
    color_weight: float = DEFAULT_COLOR_WEIGHT,
) -> float:
    """Combined similarity score in [0, 1].

    Args:
        a, b: ImageFeatures or dicts (as stored in the DB).
        phash_weight: Weight for perceptual-hash similarity (default 0.7).
        color_weight: Weight for color-histogram similarity (default 0.3).

    Returns:
        A float between 0 and 1. Identical images should approach 1.0.
    """
    if isinstance(a, dict):
        a = ImageFeatures.from_dict(a)
    if isinstance(b, dict):
        b = ImageFeatures.from_dict(b)
    weight_sum = phash_weight + color_weight
    if weight_sum <= 0:
        return 0.0
    phash_sim = _phash_similarity(a.phash, b.phash)
    color_sim = _histogram_correlation(a.histogram, b.histogram)
    score = (phash_weight * phash_sim + color_weight * color_sim) / weight_sum
    return float(max(0.0, min(1.0, score)))
