import io

from fastapi import HTTPException, status
from PIL import Image, ImageFile, UnidentifiedImageError

Image.MAX_IMAGE_PIXELS = 25_000_000
ImageFile.LOAD_TRUNCATED_IMAGES = False

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}


def decode_image(data: bytes, declared_type: str | None, max_bytes: int, max_pixels: int) -> Image.Image:
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds the {max_bytes} byte upload limit",
        )
    if not data:
        raise HTTPException(status_code=400, detail="Empty image upload")
    if declared_type and declared_type.lower() not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image type. Use JPEG, PNG, or WebP.",
        )
    try:
        with Image.open(io.BytesIO(data)) as image:
            image.verify()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="File is not a valid image") from exc

    try:
        image = Image.open(io.BytesIO(data))
        image.load()
    except Image.DecompressionBombError as exc:
        raise HTTPException(status_code=400, detail="Image is too large to process safely") from exc
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Unable to decode image") from exc

    if image.format not in ALLOWED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image type. Use JPEG, PNG, or WebP.",
        )
    width, height = image.size
    if width * height > max_pixels:
        raise HTTPException(status_code=400, detail="Image pixel count exceeds the safety limit")
    return image.convert("RGB")
