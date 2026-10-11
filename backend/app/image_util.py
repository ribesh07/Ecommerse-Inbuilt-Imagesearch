from __future__ import annotations

import hashlib
import io

from fastapi import HTTPException, status
from PIL import Image, ImageFile, UnidentifiedImageError

ImageFile.LOAD_TRUNCATED_IMAGES = False

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}


def decode_and_validate(data: bytes, content_type: str | None, max_bytes: int, max_pixels: int) -> Image.Image:
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds the {max_bytes} byte upload limit",
        )
    if not data:
        raise HTTPException(status_code=400, detail="Empty image upload")
    if content_type and content_type.lower() not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image type. Use JPEG, PNG, or WebP.")
    try:
        with Image.open(io.BytesIO(data)) as probe:
            probe.verify()
        image = Image.open(io.BytesIO(data))
        image.load()
    except Image.DecompressionBombError as exc:
        raise HTTPException(status_code=400, detail="Image is too large to process safely") from exc
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="File is not a valid image") from exc
    if image.format not in ALLOWED_FORMATS:
        raise HTTPException(status_code=400, detail="Unsupported image type. Use JPEG, PNG, or WebP.")
    if image.size[0] * image.size[1] > max_pixels:
        raise HTTPException(status_code=400, detail="Image pixel count exceeds the safety limit")
    return image.convert("RGB")


def content_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def to_jpeg_bytes(image: Image.Image, size: tuple[int, int] | None = None) -> bytes:
    canvas = image.copy()
    if size:
        canvas.thumbnail(size)
    buffer = io.BytesIO()
    canvas.save(buffer, format="JPEG", quality=88)
    return buffer.getvalue()
