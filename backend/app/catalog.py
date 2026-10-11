from __future__ import annotations

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .models import Product, ProductVendor, ProductVariant

LIST_OPTIONS = (
    selectinload(Product.brand),
    selectinload(Product.category),
    selectinload(Product.images),
    selectinload(Product.descriptions),
    selectinload(Product.specifications),
)


def visible_products() -> Select:
    return select(Product).where(Product.status == 1, Product.deleted_at.is_(None))


def apply_filters(
    stmt: Select,
    *,
    q: str | None = None,
    category_id: int | None = None,
    brand_id: int | None = None,
    vendor_id: int | None = None,
    category_ids: list[int] | None = None,
    brand_ids: list[int] | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_rating: float | None = None,
    in_stock: bool | None = None,
    attribute_name: str | None = None,
    attribute_value: str | None = None,
) -> Select:
    if q:
        term = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Product.name.ilike(term),
                Product.sku.ilike(term),
                Product.barcode.ilike(term),
                Product.short_description.ilike(term),
                Product.description.ilike(term),
            )
        )
    if category_id:
        stmt = stmt.where(Product.category_id == category_id)
    if brand_id:
        stmt = stmt.where(Product.brand_id == brand_id)
    if category_ids:
        stmt = stmt.where(Product.category_id.in_(category_ids))
    if brand_ids:
        stmt = stmt.where(Product.brand_id.in_(brand_ids))
    if vendor_id:
        from .models import ProductVendor

        stmt = stmt.join(ProductVendor, ProductVendor.product_id == Product.id).where(
            ProductVendor.vendor_id == vendor_id
        )
    if min_price is not None:
        stmt = stmt.where(Product.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Product.price <= max_price)
    if min_rating is not None:
        stmt = stmt.where(Product.rating >= min_rating)
    if in_stock is True:
        stmt = stmt.where(Product.stock > 0)
    if in_stock is False:
        stmt = stmt.where(Product.stock <= 0)
    if attribute_name and attribute_value:
        stmt = stmt.join(ProductVariant, ProductVariant.product_id == Product.id).where(
            ProductVariant.attributes.contains(
                [{"attribute_name": attribute_name, "attribute_value": attribute_value}]
            )
        )
    return stmt


def apply_sort(stmt: Select, sort: str | None) -> Select:
    mapping = {
        "newest": Product.created_at.desc(),
        "oldest": Product.created_at.asc(),
        "price_asc": Product.price.asc(),
        "price_desc": Product.price.desc(),
        "rating": Product.rating.desc(),
        "popularity": Product.review_count.desc(),
        "name_asc": Product.name.asc(),
        "name_desc": Product.name.desc(),
    }
    return stmt.order_by(mapping.get(sort or "newest", Product.created_at.desc()), Product.id.desc())


async def fetch_products(db: AsyncSession, stmt: Select, page: int, limit: int) -> tuple[list[Product], int]:
    page = max(1, page)
    limit = min(max(1, limit), 48)
    count_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
    total = int(await db.scalar(count_stmt) or 0)
    rows = (
        await db.scalars(
            stmt.options(*LIST_OPTIONS).offset((page - 1) * limit).limit(limit)
        )
    ).unique().all()
    return list(rows), total


async def get_visible_product(db: AsyncSession, product_id: int) -> Product | None:
    from .models import ProductVendor

    stmt = (
        visible_products()
        .where(Product.id == product_id)
        .options(
            *LIST_OPTIONS,
            selectinload(Product.prices),
            selectinload(Product.variants),
            selectinload(Product.vendors).selectinload(ProductVendor.vendor),
            selectinload(Product.reviews),
        )
    )
    return await db.scalar(stmt)
