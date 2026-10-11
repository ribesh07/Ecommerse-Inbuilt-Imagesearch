import io

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.config import get_settings
from app.main import app, state
from app.encoder import StubEncoder, l2_normalize


@pytest.fixture(autouse=True)
def stub_encoder(monkeypatch):
    monkeypatch.setenv("IMAGE_SEARCH_STUB", "true")
    monkeypatch.setenv("IMAGE_SEARCH_INTERNAL_TOKEN", "test-token")
    get_settings.cache_clear()
    settings = get_settings()
    state.encoder = StubEncoder(settings)
    yield
    get_settings.cache_clear()


@pytest.fixture
def client():
    return TestClient(app)


def jpeg_bytes(color: tuple[int, int, int] = (12, 80, 200)) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (64, 64), color).save(buffer, format="JPEG")
    return buffer.getvalue()


def test_health(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["model_loaded"] is True
    assert body["embedding_dim"] == 512


def test_unauthorized_embed_rejected(client: TestClient):
    response = client.post("/embed", files={"file": ("a.jpg", jpeg_bytes(), "image/jpeg")})
    assert response.status_code == 401


def test_valid_image_normalized_embedding(client: TestClient):
    response = client.post(
        "/embed",
        headers={"X-Internal-Token": "test-token"},
        files={"file": ("a.jpg", jpeg_bytes(), "image/jpeg")},
    )
    assert response.status_code == 200
    body = response.json()
    vector = np.array(body["embedding"], dtype=np.float32)
    assert body["dim"] == 512
    assert vector.shape == (512,)
    assert abs(float(np.linalg.norm(vector)) - 1.0) < 1e-4
    assert abs(body["l2_norm"] - 1.0) < 1e-4
    assert body["model_version"].endswith("stub")


def test_invalid_image_rejected(client: TestClient):
    response = client.post(
        "/embed",
        headers={"X-Internal-Token": "test-token"},
        files={"file": ("a.jpg", b"not-an-image", "image/jpeg")},
    )
    assert response.status_code == 400


def test_oversized_upload_rejected(client: TestClient, monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("MAX_UPLOAD_BYTES", "128")
    monkeypatch.setenv("IMAGE_SEARCH_STUB", "true")
    monkeypatch.setenv("IMAGE_SEARCH_INTERNAL_TOKEN", "test-token")
    get_settings.cache_clear()
    from app.config import Settings

    settings = Settings()
    state.encoder = StubEncoder(settings)
    huge = jpeg_bytes() + b"0" * 200
    response = client.post(
        "/embed",
        headers={"X-Internal-Token": "test-token"},
        files={"file": ("a.jpg", huge, "image/jpeg")},
    )
    assert response.status_code in (400, 413)


def test_l2_normalize_rejects_zero():
    with pytest.raises(ValueError):
        l2_normalize(np.zeros(8, dtype=np.float32))
