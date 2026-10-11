"""Integration tests for image indexing and the search-by-image API."""

from __future__ import annotations

import io
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.image_util import content_hash
from app.indexing import (
    STATUS_FAILED,
    STATUS_INDEXED,
    backfill_catalog,
    index_image,
    index_product_images,
)
from app.models import Brand, Category, Product, ProductDescription, ProductImage, ProductImageEmbedding, ProductPrice
from app.storage import save_bytes


def _make_image_bytes(color=(30, 90, 180), size=(128, 128), fmt="JPEG") -> bytes:
    img = Image.new("RGB", size, color)
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


def _persist_image(color=(30, 90, 180)) -> tuple[str, str]:
    """Save a JPEG to the upload dir and return (image_url, content_hash)."""
    data = _make_image_bytes(color=color)
    url = save_bytes(data, suffix=".jpg", subdir="products")
    return url, content_hash(data)


async def _create_product(
    db: AsyncSession,
    sku: str,
    color=(30, 90, 180),
    status: int = 1,
    deleted: bool = False,
) -> Product:
    settings = get_settings()
    brand = await db.scalar(select(Brand).where(Brand.slug == f"brand-{sku.lower()}"))
    if not brand:
        brand = Brand(name=f"Brand {sku}", slug=f"brand-{sku.lower()}")
        db.add(brand)
        await db.flush()
    category = await db.scalar(select(Category).where(Category.slug == "test-cat"))
    if not category:
        category = Category(name="Test", slug="test-cat", level=0)
        db.add(category)
        await db.flush()

    product = Product(
        name=f"Product {sku}",
        slug=sku.lower(),
        sku=sku,
        price=Decimal("10.00"),
        stock=10,
        status=status,
        deleted_at=datetime.now(timezone.utc).replace(tzinfo=None) if deleted else None,
        brand_id=brand.id,
        category_id=category.id,
    )
    db.add(product)
    await db.flush()
    db.add(
        ProductDescription(
            product_id=product.id,
            language_code="en",
            title=product.name,
            short_description=product.name,
            description=product.name,
        )
    )
    db.add(
        ProductPrice(
            product_id=product.id,
            country_code="NP",
            currency_code="NPR",
            price=product.price,
            is_active=True,
        )
    )
    url, digest = _persist_image(color=color)
    db.add(
        ProductImage(
            product_id=product.id,
            image_url=url,
            thumbnail_url=url,
            alt_text=product.name,
            sort_order=0,
            is_primary=True,
            content_hash=digest,
        )
    )
    await db.commit()
    return product


@pytest.mark.asyncio
async def test_index_image_success(db_session: AsyncSession):
    product = await _create_product(db_session, "INDEX-001", color=(50, 120, 200))
    image = (await db_session.scalars(select(ProductImage).where(ProductImage.product_id == product.id))).one()
    row = await index_image(db_session, image)
    assert row.status == STATUS_INDEXED
    assert row.features is not None
    assert "phash" in row.features
    assert "histogram" in row.features
    assert row.model_version == "phash-color-v1"


@pytest.mark.asyncio
async def test_repeated_indexing_no_duplicates(db_session: AsyncSession):
    product = await _create_product(db_session, "INDEX-002", color=(200, 60, 40))
    image = (await db_session.scalars(select(ProductImage).where(ProductImage.product_id == product.id))).one()
    await index_image(db_session, image)
    await index_image(db_session, image)
    await index_image(db_session, image)
    rows = (
        await db_session.scalars(
            select(ProductImageEmbedding).where(ProductImageEmbedding.product_image_id == image.id)
        )
    ).all()
    assert len(rows) == 1
    assert rows[0].status == STATUS_INDEXED


@pytest.mark.asyncio
async def test_reindex_after_image_change(db_session: AsyncSession):
    product = await _create_product(db_session, "INDEX-003", color=(10, 10, 10))
    image = (await db_session.scalars(select(ProductImage).where(ProductImage.product_id == product.id))).one()
    row = await index_image(db_session, image)
    original_features = row.features

    # Replace the image file with a structurally different image (checkerboard)
    # and update the content hash.
    import numpy as np
    from PIL import Image as PILImage

    arr = np.zeros((128, 128, 3), dtype=np.uint8)
    block = 16
    for y in range(128):
        for x in range(128):
            if ((x // block) + (y // block)) % 2 == 0:
                arr[y, x] = [255, 255, 255]
            else:
                arr[y, x] = [0, 0, 0]
    buf = io.BytesIO()
    PILImage.fromarray(arr, "RGB").save(buf, format="JPEG")
    new_data = buf.getvalue()

    from app.indexing import _local_image_path

    local = _local_image_path(image.image_url)
    assert local is not None
    local.write_bytes(new_data)
    image.content_hash = content_hash(new_data)
    await db_session.commit()

    row2 = await index_image(db_session, image, force=True)
    assert row2.features["phash"] != original_features["phash"]
    assert row2.features["histogram"] != original_features["histogram"]
    assert row2.image_hash == content_hash(new_data)


@pytest.mark.asyncio
async def test_search_returns_expected_product(db_session: AsyncSession):
    color = (123, 45, 67)
    product = await _create_product(db_session, "SEARCH-001", color=color)
    image = (await db_session.scalars(select(ProductImage).where(ProductImage.product_id == product.id))).one()
    await index_image(db_session, image)
    await db_session.commit()

    query_bytes = _make_image_bytes(color=color)
    from app.indexing import similar_product_ids
    from app.image_features import extract_features

    features = extract_features(query_bytes)
    ranked = await similar_product_ids(db_session, features.to_dict(), limit=10)
    ids = [pid for pid, _ in ranked]
    assert product.id in ids
    assert ranked[0][0] == product.id


@pytest.mark.asyncio
async def test_deleted_inactive_excluded(db_session: AsyncSession):
    active = await _create_product(db_session, "ACTIVE-001", color=(10, 20, 30))
    inactive = await _create_product(db_session, "INACTIVE-001", color=(10, 20, 30), status=0)
    deleted = await _create_product(db_session, "DELETED-001", color=(10, 20, 30), deleted=True)

    for p in (active, inactive, deleted):
        img = (await db_session.scalars(select(ProductImage).where(ProductImage.product_id == p.id))).one()
        await index_image(db_session, img)
    await db_session.commit()

    from app.indexing import similar_product_ids
    from app.image_features import extract_features

    features = extract_features(_make_image_bytes(color=(10, 20, 30)))
    ranked = await similar_product_ids(db_session, features.to_dict(), limit=10)
    ids = [pid for pid, _ in ranked]
    assert active.id in ids
    assert inactive.id not in ids
    assert deleted.id not in ids


@pytest.mark.asyncio
async def test_empty_catalog_no_match(db_session: AsyncSession):
    from app.indexing import similar_product_ids
    from app.image_features import extract_features

    features = extract_features(_make_image_bytes(color=(1, 2, 3)))
    ranked = await similar_product_ids(db_session, features.to_dict(), limit=10)
    assert ranked == []


@pytest.mark.asyncio
async def test_backfill_stats(db_session: AsyncSession):
    await _create_product(db_session, "BACKFILL-001", color=(50, 50, 50))
    await _create_product(db_session, "BACKFILL-002", color=(150, 150, 150))
    stats = await backfill_catalog(db_session, batch_size=1)
    assert stats["scanned"] >= 2
    assert stats["indexed"] >= 2
    assert stats["failed"] == 0


def test_search_by_image_api_rejects_invalid(client: TestClient):
    resp = client.post(
        "/api/v1/products/search/image",
        files={"file": ("x.jpg", b"not an image", "image/jpeg")},
    )
    assert resp.status_code in (400, 422)


def test_search_by_image_api_rejects_oversized(client: TestClient, monkeypatch):
    from app import config as cfg

    monkeypatch.setattr(cfg.get_settings(), "max_upload_bytes", 10)
    big = _make_image_bytes(color=(1, 2, 3))
    resp = client.post(
        "/api/v1/products/search/image",
        files={"file": ("big.jpg", big, "image/jpeg")},
    )
    assert resp.status_code in (400, 413)


def test_search_by_image_api_empty_catalog(client: TestClient):
    data = _make_image_bytes(color=(10, 20, 30))
    resp = client.post(
        "/api/v1/products/search/image",
        files={"file": ("q.jpg", data, "image/jpeg")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["items"] == []


def test_existing_product_listing_still_works(client: TestClient):
    resp = client.get("/api/v1/products", params={"limit": 5})
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert "items" in body["data"]
