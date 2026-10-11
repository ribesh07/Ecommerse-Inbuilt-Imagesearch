from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..barcode import validate_barcode
from ..catalog import (
    LIST_OPTIONS,
    apply_filters,
    apply_sort,
    fetch_products,
    get_visible_product,
    visible_products,
)
from ..config import get_settings
from ..db import get_db
from ..envelope import ok, paginated
from ..image_features import ImageFeatureError, extract_features
from ..image_util import decode_and_validate
from ..indexing import STATUS_INDEXED, similar_product_ids
from ..models import Brand, Category, Product, ProductImageEmbedding, Review
from ..query_parser import parse_product_query, validate_price_range
from ..serialize import image_out, product_detail, product_list_item, product_vendor_out, review_out, variant_out

router = APIRouter(tags=["Products"])


def _parse_id_list(raw: str | None) -> list[int] | None:
    if not raw:
        return None
    values = []
    for part in raw.split(","):
        part = part.strip()
        if part.isdigit():
            values.append(int(part))
    return values or None


@router.get("/products")
async def list_products(
    db: AsyncSession = Depends(get_db),
    page: int = 1,
    limit: int = 24,
    q: str | None = None,
    category_id: int | None = None,
    brand_id: int | None = None,
    vendor_id: int | None = None,
    category_ids: str | None = None,
    brand_ids: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_rating: float | None = None,
    in_stock: bool | None = None,
    sort: str = "newest",
    attribute_name: str | None = None,
    attribute_value: str | None = None,
):
    try:
        min_price, max_price = validate_price_range(min_price, max_price)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    stmt = apply_filters(
        visible_products(),
        q=q,
        category_id=category_id,
        brand_id=brand_id,
        vendor_id=vendor_id,
        category_ids=_parse_id_list(category_ids),
        brand_ids=_parse_id_list(brand_ids),
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        in_stock=in_stock,
        attribute_name=attribute_name,
        attribute_value=attribute_value,
    )
    stmt = apply_sort(stmt, sort)
    rows, total = await fetch_products(db, stmt, page, limit)
    return ok(paginated([product_list_item(p) for p in rows], page, limit, total))


@router.get("/products/search")
async def search_products(
    db: AsyncSession = Depends(get_db),
    q: str = Query(..., min_length=1),
    page: int = 1,
    limit: int = 24,
    parse_nl: bool = False,
    category_id: int | None = None,
    brand_id: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    in_stock: bool | None = None,
    sort: str = "newest",
):
    query_text = q
    if parse_nl:
        parsed = parse_product_query(q)
        query_text = parsed.q
        min_price = min_price if min_price is not None else parsed.min_price
        max_price = max_price if max_price is not None else parsed.max_price
        in_stock = in_stock if in_stock is not None else parsed.in_stock
        if parsed.color:
            query_text = f"{query_text} {parsed.color}".strip()
    return await list_products(
        db=db,
        page=page,
        limit=limit,
        q=query_text,
        category_id=category_id,
        brand_id=brand_id,
        min_price=min_price,
        max_price=max_price,
        in_stock=in_stock,
        sort=sort,
    )


@router.get("/products/featured")
async def featured(db: AsyncSession = Depends(get_db), page: int = 1, limit: int = 12):
    return await list_products(db=db, page=page, limit=limit, sort="rating")


@router.get("/products/latest")
async def latest(db: AsyncSession = Depends(get_db), page: int = 1, limit: int = 12):
    return await list_products(db=db, page=page, limit=limit, sort="newest")


@router.get("/products/filters")
async def product_filters(
    db: AsyncSession = Depends(get_db),
    category_id: int | None = None,
    brand_id: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    q: str | None = None,
):
    stmt = apply_filters(
        visible_products(),
        q=q,
        category_id=category_id,
        brand_id=brand_id,
        min_price=min_price,
        max_price=max_price,
    )
    sub = stmt.subquery()
    brands = (
        await db.execute(
            select(Brand.id, Brand.name, func.count(sub.c.id))
            .join(sub, sub.c.brand_id == Brand.id)
            .group_by(Brand.id, Brand.name)
        )
    ).all()
    categories = (
        await db.execute(
            select(Category.id, Category.name, func.count(sub.c.id))
            .join(sub, sub.c.category_id == Category.id)
            .group_by(Category.id, Category.name)
        )
    ).all()
    price_row = await db.execute(select(func.min(sub.c.price), func.max(sub.c.price)))
    min_p, max_p = price_row.one()
    return ok(
        {
            "brands": [{"id": i, "name": n, "count": int(c)} for i, n, c in brands],
            "categories": [{"id": i, "name": n, "count": int(c)} for i, n, c in categories],
            "vendors": [],
            "price": {"min": float(min_p or 0), "max": float(max_p or 0)},
            "ratings": [5, 4, 3, 2, 1],
        }
    )


@router.get("/products/barcode/{code}")
async def lookup_barcode(code: str, db: AsyncSession = Depends(get_db)):
    barcode = validate_barcode(code)
    from ..models import ProductVariant

    product = await db.scalar(visible_products().where(Product.barcode == barcode).options(*LIST_OPTIONS))
    if not product:
        variant = await db.scalar(
            select(ProductVariant).where(ProductVariant.barcode == barcode, ProductVariant.status == 1)
        )
        if variant:
            product = await db.scalar(
                visible_products().where(Product.id == variant.product_id).options(*LIST_OPTIONS)
            )
    if not product:
        return ok(
            paginated([], 1, 1, 0),
            message="No product in this catalog matches that barcode.",
        )
    return ok(paginated([product_list_item(product)], 1, 1, 1), message="Exact barcode match")


@router.get("/products/{product_id}")
async def product_by_id(product_id: int, db: AsyncSession = Depends(get_db)):
    product = await get_visible_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ok(product_detail(product))


@router.get("/products/{product_id}/related")
async def related(product_id: int, limit: int = 12, db: AsyncSession = Depends(get_db)):
    product = await get_visible_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    stmt = apply_sort(visible_products().where(Product.id != product_id, Product.category_id == product.category_id), "popularity")
    rows, total = await fetch_products(db, stmt, 1, limit)
    return ok(paginated([product_list_item(p) for p in rows], 1, limit, total))


@router.get("/products/{product_id}/similar")
async def similar(product_id: int, limit: int = 12, db: AsyncSession = Depends(get_db)):
    product = await get_visible_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    settings = get_settings()
    source = await db.scalar(
        select(ProductImageEmbedding).where(
            ProductImageEmbedding.product_id == product_id,
            ProductImageEmbedding.status == STATUS_INDEXED,
            ProductImageEmbedding.model_version == settings.model_version,
            ProductImageEmbedding.features.is_not(None),
        )
    )
    if not source or source.features is None:
        return ok(paginated([], 1, limit, 0), message="This product has no indexed image yet.")
    try:
        ranked = await similar_product_ids(
            db, source.features, exclude_product_id=product_id, limit=limit
        )
    except Exception:
        return ok(paginated([], 1, limit, 0), message="Similarity search is temporarily unavailable.")
    return await _hydrate_ranked(db, ranked, limit)


@router.get("/products/{product_id}/variants")
async def variants(product_id: int, db: AsyncSession = Depends(get_db)):
    product = await get_visible_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ok([variant_out(v) for v in product.variants])


@router.get("/products/{product_id}/vendors")
async def vendors(product_id: int, db: AsyncSession = Depends(get_db)):
    product = await get_visible_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ok([product_vendor_out(v) for v in product.vendors])


@router.get("/products/{product_id}/images")
async def images(product_id: int, db: AsyncSession = Depends(get_db)):
    product = await get_visible_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ok([image_out(i) for i in product.images])


@router.get("/products/{product_id}/reviews")
async def reviews(product_id: int, page: int = 1, limit: int = 10, db: AsyncSession = Depends(get_db)):
    product = await db.get(Product, product_id)
    if not product or product.status != 1 or product.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Product not found")
    total = int(await db.scalar(select(func.count()).where(Review.product_id == product_id)) or 0)
    rows = (
        await db.scalars(
            select(Review)
            .where(Review.product_id == product_id)
            .order_by(Review.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
    ).all()
    return ok(paginated([review_out(r) for r in rows], page, limit, total))


@router.get("/products/{product_id}/reviews/summary")
async def review_summary(product_id: int, db: AsyncSession = Depends(get_db)):
    product = await get_visible_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ok(
        {
            "average_rating": float(product.rating or 0),
            "total_reviews": product.review_count,
            "distribution": {},
        }
    )


@router.post("/search/image", tags=["Image Search"])
@router.post("/products/search/image", tags=["Image Search"])
async def search_by_image(
    file: UploadFile = File(..., description="JPEG, PNG, or WebP query image"),
    limit: int = Query(24, ge=1, le=48),
    db: AsyncSession = Depends(get_db),
):
    settings = get_settings()
    data = await file.read(settings.max_upload_bytes + 1)
    decode_and_validate(data, file.content_type, settings.max_upload_bytes, settings.max_image_pixels)
    try:
        features = extract_features(data, max_pixels=settings.max_image_pixels)
    except ImageFeatureError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    try:
        ranked = await similar_product_ids(
            db,
            features.to_dict(),
            limit=limit,
        )
    except Exception:
        raise HTTPException(status_code=503, detail="Similarity search is temporarily unavailable") from None
    if not ranked:
        return ok(
            paginated([], 1, limit, 0),
            message="No indexed catalog products match this image yet. Upload and index products first.",
        )
    return await _hydrate_ranked(db, ranked, limit)


async def _hydrate_ranked(db: AsyncSession, ranked: list[tuple[int, float]], limit: int):
    from ..catalog import LIST_OPTIONS

    ids = [pid for pid, _ in ranked]
    if not ids:
        return ok(paginated([], 1, limit, 0), message="No indexed catalog products match this image yet.")
    products = (
        await db.scalars(visible_products().where(Product.id.in_(ids)).options(*LIST_OPTIONS))
    ).unique().all()
    by_id = {p.id: p for p in products}
    items = []
    for pid, score in ranked:
        product = by_id.get(pid)
        if not product:
            continue
        item = product_list_item(product)
        item["similarity"] = round(score, 4)
        items.append(item)
    return ok(paginated(items, 1, limit, len(items)))
