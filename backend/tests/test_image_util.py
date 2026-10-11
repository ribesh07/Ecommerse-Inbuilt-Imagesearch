from io import BytesIO

import pytest
from fastapi import HTTPException
from PIL import Image

from app.image_util import content_hash, decode_and_validate


def _image(fmt="JPEG", size=(32, 32), color=(10, 20, 30)) -> bytes:
    buf = BytesIO()
    Image.new("RGB", size, color).save(buf, format=fmt)
    return buf.getvalue()


def test_valid_jpeg():
    image = decode_and_validate(_image(), "image/jpeg", 8_000_000, 25_000_000)
    assert image.mode == "RGB"


def test_invalid_rejected():
    with pytest.raises(HTTPException) as exc:
        decode_and_validate(b"hello", "image/jpeg", 8_000_000, 25_000_000)
    assert exc.value.status_code == 400


def test_oversized_rejected():
    data = _image()
    with pytest.raises(HTTPException) as exc:
        decode_and_validate(data, "image/jpeg", max_bytes=10, max_pixels=25_000_000)
    assert exc.value.status_code == 413


def test_content_hash_stable():
    data = _image()
    assert content_hash(data) == content_hash(data)
