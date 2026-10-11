from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..catalog import apply_sort, fetch_products, visible_products
from ..db import get_db
from ..envelope import ok, paginated
from ..models import Brand, Category, Product, Vendor
from ..serialize import brand_out, category_out, product_list_item, vendor_out

router = APIRouter(tags=["Catalog"])


@router.get("/categories")
async def list_categories(
    db: AsyncSession = Depends(get_db),
    page: int = 1,
    limit: int = 50,
    parent_id: int | None = None,
    q: str | None = None,
):
    stmt = select(Category)
    if parent_id is not None:
        stmt = stmt.where(Category.parent_id == parent_id)
    if q:
        stmt = stmt.where(Category.name.ilike(f"%{q}%"))
    total = int(await db.scalar(select(func.count()).select_from(stmt.subquery())) or 0)
    rows = (
        await db.scalars(stmt.order_by(Category.name).offset((page - 1) * limit).limit(limit))
    ).all()
    return ok(paginated([category_out(c) for c in rows], page, limit, total))


@router.get("/categories/tree")
async def category_tree(db: AsyncSession = Depends(get_db)):
    rows = (await db.scalars(select(Category).options(selectinload(Category.children)).order_by(Category.name))).all()
    by_parent: dict[int | None, list[Category]] = {}
    for row in rows:
        by_parent.setdefault(row.parent_id, []).append(row)

    def build(parent_id: int | None) -> list[dict]:
        items = []
        for cat in by_parent.get(parent_id, []):
            node = category_out(cat)
            node["children"] = build(cat.id)
            items.append(node)
        return items

    return ok(build(None))


@router.get("/categories/{category_id}")
async def get_category(category_id: int, db: AsyncSession = Depends(get_db)):
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return ok(category_out(category))


@router.get("/categories/{category_id}/children")
async def category_children(category_id: int, db: AsyncSession = Depends(get_db)):
    rows = (await db.scalars(select(Category).where(Category.parent_id == category_id))).all()
    return ok([category_out(c) for c in rows])


@router.get("/categories/{category_id}/breadcrumb")
async def breadcrumb(category_id: int, db: AsyncSession = Depends(get_db)):
    trail = []
    current = await db.get(Category, category_id)
    while current:
        trail.append(category_out(current))
        if not current.parent_id:
            break
        current = await db.get(Category, current.parent_id)
    trail.reverse()
    return ok(trail)


@router.get("/brands")
async def list_brands(db: AsyncSession = Depends(get_db), page: int = 1, limit: int = 24, q: str | None = None):
    stmt = select(Brand)
    if q:
        stmt = stmt.where(Brand.name.ilike(f"%{q}%"))
    total = int(await db.scalar(select(func.count()).select_from(stmt.subquery())) or 0)
    rows = (await db.scalars(stmt.order_by(Brand.name).offset((page - 1) * limit).limit(limit))).all()
    return ok(paginated([brand_out(b) for b in rows], page, limit, total))


@router.get("/brands/search")
async def search_brands(q: str, page: int = 1, limit: int = 24, db: AsyncSession = Depends(get_db)):
    return await list_brands(db=db, page=page, limit=limit, q=q)


@router.get("/brands/{brand_id}")
async def get_brand(brand_id: int, db: AsyncSession = Depends(get_db)):
    brand = await db.get(Brand, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return ok(brand_out(brand))


@router.get("/brands/{brand_id}/products")
async def brand_products(brand_id: int, page: int = 1, limit: int = 24, db: AsyncSession = Depends(get_db)):
    stmt = apply_sort(visible_products().where(Product.brand_id == brand_id), "newest")
    rows, total = await fetch_products(db, stmt, page, limit)
    return ok(paginated([product_list_item(p) for p in rows], page, limit, total))


@router.get("/vendors")
async def list_vendors(db: AsyncSession = Depends(get_db), page: int = 1, limit: int = 24, q: str | None = None):
    stmt = select(Vendor)
    if q:
        stmt = stmt.where(or_(Vendor.name.ilike(f"%{q}%"), Vendor.slug.ilike(f"%{q}%")))
    total = int(await db.scalar(select(func.count()).select_from(stmt.subquery())) or 0)
    rows = (await db.scalars(stmt.order_by(Vendor.name).offset((page - 1) * limit).limit(limit))).all()
    return ok(paginated([vendor_out(v) for v in rows], page, limit, total))


@router.get("/vendors/search")
async def search_vendors(q: str, page: int = 1, limit: int = 24, db: AsyncSession = Depends(get_db)):
    return await list_vendors(db=db, page=page, limit=limit, q=q)


@router.get("/vendors/{vendor_id}")
async def get_vendor(vendor_id: int, db: AsyncSession = Depends(get_db)):
    vendor = await db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return ok(vendor_out(vendor))


@router.get("/vendors/{vendor_id}/products")
async def vendor_products(vendor_id: int, page: int = 1, limit: int = 24, db: AsyncSession = Depends(get_db)):
    from ..catalog import apply_filters

    stmt = apply_sort(apply_filters(visible_products(), vendor_id=vendor_id), "newest")
    rows, total = await fetch_products(db, stmt, page, limit)
    return ok(paginated([product_list_item(p) for p in rows], page, limit, total))
