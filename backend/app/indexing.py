from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .image_features import ImageFeatureError, extract_features
from .models import Product, ProductImage, ProductImageEmbedding
from .storage import delete_local_url

logger = logging.getLogger(__name__)

STATUS_PENDING = "PENDING"
STATUS_INDEXED = "INDEXED"
STATUS_FAILED = "FAILED"


def _local_image_path(image_url: str) -> Path | None:
    settings = get_settings()
    parsed = urlparse(image_url)
    path = parsed.path if parsed.scheme else image_url
    if not path.startswith("/uploads/"):
        return None
    return Path(settings.upload_dir) / path.removeprefix("/uploads/")


def read_catalog_image_bytes(image_url: str) -> bytes:
    """Only read local allowlisted catalog files. Never fetch arbitrary remote URLs."""
    settings = get_settings()
    parsed = urlparse(image_url)
    if parsed.scheme in {"http", "https"}:
        host = (parsed.hostname or "").lower()
        allowed = {h.strip().lower() for h in settings.allowlisted_image_hosts.split(",")}
        if host not in allowed:
            raise RuntimeError(f"Refusing to read image from non-allowlisted host {host}")
        local = _local_image_path(image_url)
        if local and local.is_file():
            return local.read_bytes()
        raise RuntimeError("Remote catalog image hosts other than local uploads are not fetched at index time")
    local = _local_image_path(image_url)
    if not local or not local.is_file():
        raise RuntimeError("Catalog image file is missing from local storage")
    return local.read_bytes()


async def ensure_embedding_row(
    db: AsyncSession,
    image: ProductImage,
    model_version: str,
    image_hash: str,
) -> ProductImageEmbedding:
    row = await db.scalar(
        select(ProductImageEmbedding).where(
            ProductImageEmbedding.product_image_id == image.id,
            ProductImageEmbedding.model_version == model_version,
        )
    )
    if row:
        if row.image_hash != image_hash or row.image_url != image.image_url:
            row.status = STATUS_PENDING
            row.embedding = None
            row.features = None
            row.image_hash = image_hash
            row.image_url = image.image_url
            row.error_message = None
        return row
    row = ProductImageEmbedding(
        product_id=image.product_id,
        product_image_id=image.id,
        image_url=image.image_url,
        image_hash=image_hash,
        model_version=model_version,
        status=STATUS_PENDING,
    )
    db.add(row)
    await db.flush()
    return row


async def index_image(db: AsyncSession, image: ProductImage, force: bool = False) -> ProductImageEmbedding:
    settings = get_settings()
    model_version = settings.model_version
    image_hash = image.content_hash or ""
    row = await ensure_embedding_row(db, image, model_version, image_hash)
    if (
        not force
        and row.status == STATUS_INDEXED
        and row.features is not None
        and row.image_hash == image_hash
        and row.model_version == model_version
    ):
        return row
    try:
        data = read_catalog_image_bytes(image.image_url)
        features = extract_features(data, max_pixels=settings.max_image_pixels)
        row.features = features.to_dict()
        row.model_version = model_version
        row.status = STATUS_INDEXED
        row.error_message = None
        row.indexed_at = datetime.now(timezone.utc).replace(tzinfo=None)
        row.image_hash = image_hash
        row.image_url = image.image_url
        # The legacy vector column is no longer populated by the model-free pipeline.
        row.embedding = None
    except (ImageFeatureError, RuntimeError, OSError) as exc:
        logger.warning("Indexing failed for image %s: %s", image.id, exc)
        row.status = STATUS_FAILED
        row.error_message = str(exc)
        row.features = None
        row.embedding = None
    await db.flush()
    return row


async def index_product_images(db: AsyncSession, product_id: int, force: bool = False) -> list[ProductImageEmbedding]:
    images = (
        await db.scalars(select(ProductImage).where(ProductImage.product_id == product_id).order_by(ProductImage.sort_order))
    ).all()
    results = []
    for image in images:
        results.append(await index_image(db, image, force=force))
    await db.commit()
    return results


async def similar_product_ids(
    db: AsyncSession,
    query_features: dict,
    *,
    exclude_product_id: int | None = None,
    limit: int = 24,
    min_similarity: float | None = None,
) -> list[tuple[int, float]]:
    """In-memory similarity search over indexed product image features.

    Retrieves all indexed features from the DB, computes similarity against the
    query features in Python, and returns the top products (best image score
    per product) sorted by descending similarity.
    """
    from .image_features import compute_similarity

    settings = get_settings()
    if min_similarity is None:
        min_similarity = settings.image_search_min_similarity

    stmt = (
        select(ProductImageEmbedding)
        .join(Product, Product.id == ProductImageEmbedding.product_id)
        .where(
            ProductImageEmbedding.status == STATUS_INDEXED,
            ProductImageEmbedding.model_version == settings.model_version,
            ProductImageEmbedding.features.is_not(None),
            Product.status == 1,
            Product.deleted_at.is_(None),
        )
    )
    rows = (await db.scalars(stmt)).all()

    best_per_product: dict[int, float] = {}
    for row in rows:
        if row.product_id == exclude_product_id:
            continue
        score = compute_similarity(query_features, row.features)
        if score < min_similarity:
            continue
        current = best_per_product.get(row.product_id, -1.0)
        if score > current:
            best_per_product[row.product_id] = score

    ranked = sorted(best_per_product.items(), key=lambda x: x[1], reverse=True)
    return ranked[:limit]


async def indexing_status(db: AsyncSession) -> dict:
    rows = (
        await db.execute(
            select(ProductImageEmbedding.status, func.count()).group_by(ProductImageEmbedding.status)
        )
    ).all()
    counts = {status: 0 for status in (STATUS_PENDING, STATUS_INDEXED, STATUS_FAILED)}
    for status, count in rows:
        counts[status] = int(count)
    return counts


async def cleanup_embeddings_for_image(db: AsyncSession, image: ProductImage) -> None:
    await db.execute(
        update(ProductImageEmbedding)
        .where(ProductImageEmbedding.product_image_id == image.id)
        .values(status=STATUS_FAILED, embedding=None, features=None, error_message="Image replaced")
    )
    delete_local_url(image.image_url)
    if image.thumbnail_url != image.image_url:
        delete_local_url(image.thumbnail_url)


async def backfill_catalog(db: AsyncSession, batch_size: int = 20, force: bool = False) -> dict:
    settings = get_settings()
    images = (
        await db.scalars(
            select(ProductImage)
            .join(Product, Product.id == ProductImage.product_id)
            .where(Product.deleted_at.is_(None))
            .order_by(ProductImage.id)
        )
    ).all()
    stats = {"scanned": 0, "indexed": 0, "skipped": 0, "failed": 0}
    for image in images:
        stats["scanned"] += 1
        row = await index_image(db, image, force=force)
        if row.status == STATUS_INDEXED:
            stats["indexed"] += 1
        elif row.status == STATUS_FAILED:
            stats["failed"] += 1
        else:
            stats["skipped"] += 1
        if stats["scanned"] % batch_size == 0:
            await db.commit()
    await db.commit()
    logger.info("Catalog backfill complete using model %s: %s", settings.model_version, stats)
    return stats
