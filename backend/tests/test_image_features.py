"""Tests for model-free image feature extraction and similarity."""

from io import BytesIO

import numpy as np
import pytest
from PIL import Image

from app.image_features import (
    ImageFeatureError,
    compute_similarity,
    extract_features,
)


def _image_bytes(fmt="JPEG", size=(64, 64), color=(10, 20, 30), pattern: str | None = None) -> bytes:
    img = Image.new("RGB", size, color)
    if pattern == "gradient":
        arr = np.zeros((size[1], size[0], 3), dtype=np.uint8)
        for i in range(size[0]):
            arr[:, i] = [int(i * 255 / size[0]), 100, 50]
        img = Image.fromarray(arr, "RGB")
    elif pattern == "checkerboard":
        arr = np.zeros((size[1], size[0], 3), dtype=np.uint8)
        block = 8
        for y in range(size[1]):
            for x in range(size[0]):
                if (x // block + y // block) % 2 == 0:
                    arr[y, x] = [250, 250, 250]
                else:
                    arr[y, x] = [10, 10, 10]
        img = Image.fromarray(arr, "RGB")
    buf = BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


def test_valid_jpeg():
    features = extract_features(_image_bytes("JPEG"))
    assert features.phash
    assert len(features.histogram) == 16 * 3
    assert features.width == 64
    assert features.height == 64


def test_valid_png():
    features = extract_features(_image_bytes("PNG", color=(200, 100, 50)))
    assert features.phash
    assert len(features.histogram) == 48
    # histogram should be roughly normalized (sum ~ 3.0 since 3 channels each sum to 1)
    assert 2.9 < sum(features.histogram) < 3.1


def test_corrupted_image():
    with pytest.raises(ImageFeatureError):
        extract_features(b"not an image at all")


def test_unsupported_format():
    # Create a BMP and save as raw bytes; Pillow will reject the format check.
    img = Image.new("RGB", (8, 8), (1, 2, 3))
    buf = BytesIO()
    img.save(buf, format="BMP")
    with pytest.raises(ImageFeatureError):
        extract_features(buf.getvalue())


def test_phash_format():
    features = extract_features(_image_bytes())
    # phash hex string should be 16 hex chars (64 bits).
    assert isinstance(features.phash, str)
    assert len(features.phash) == 16
    int(features.phash, 16)  # valid hex


def test_histogram_serialization():
    features = extract_features(_image_bytes())
    d = features.to_dict()
    assert "phash" in d and "histogram" in d
    assert isinstance(d["histogram"], list)
    assert all(isinstance(v, float) for v in d["histogram"])
    # round-trip
    restored = type(features).from_dict(d)
    assert restored.phash == features.phash
    assert restored.histogram == features.histogram


def test_identical_images_similarity():
    data = _image_bytes(color=(123, 45, 67))
    a = extract_features(data)
    b = extract_features(data)
    score = compute_similarity(a, b)
    assert score > 0.99
    assert 0.0 <= score <= 1.0


def test_visually_similar_images():
    # Two images with the same color should have high similarity.
    a = extract_features(_image_bytes(color=(200, 60, 40)))
    b = extract_features(_image_bytes(color=(210, 65, 45)))
    score = compute_similarity(a, b)
    assert score > 0.6


def test_dissimilar_images():
    # Solid blue vs high-contrast checkerboard: structurally and chromatically
    # different, so the combined score should be well below identical.
    a = extract_features(_image_bytes(color=(10, 10, 200)))
    b = extract_features(_image_bytes(pattern="checkerboard"))
    score = compute_similarity(a, b)
    assert score < 0.9


def test_scores_in_range():
    a = extract_features(_image_bytes(color=(10, 20, 30)))
    b = extract_features(_image_bytes(color=(200, 100, 50)))
    score = compute_similarity(a, b)
    assert 0.0 <= score <= 1.0


def test_dict_input_supported():
    a = extract_features(_image_bytes(color=(50, 50, 50)))
    b = extract_features(_image_bytes(color=(60, 60, 60)))
    score = compute_similarity(a.to_dict(), b.to_dict())
    assert 0.0 <= score <= 1.0


def test_weighted_similarity():
    a = extract_features(_image_bytes(color=(50, 50, 50)))
    b = extract_features(_image_bytes(color=(60, 60, 60)))
    s_default = compute_similarity(a, b)
    s_color_only = compute_similarity(a, b, phash_weight=0.0, color_weight=1.0)
    s_phash_only = compute_similarity(a, b, phash_weight=1.0, color_weight=0.0)
    assert 0.0 <= s_color_only <= 1.0
    assert 0.0 <= s_phash_only <= 1.0
