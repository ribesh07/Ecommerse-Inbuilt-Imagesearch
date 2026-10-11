from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..barcode import normalize_barcode, validate_barcode
from ..catalog import get_visible_product
from ..config import get_settings
from ..db import get_db
from ..envelope import ok
from ..image_util import content_hash, decode_and_validate, to_jpeg_bytes
from ..indexing import STATUS_FAILED, cleanup_embeddings_for_image, index_product_images, indexing_status
from ..models import Product, ProductDescription, ProductImage, ProductPrice, User
from ..security import get_current_admin
from ..serialize import image_out, product_detail
from ..storage import save_bytes

router = APIRouter(prefix="/admin", tags=["Admin", "Image Upload"])


def _slugify(value: str) -> str:
    cleaned = "".join(ch.lower() if ch.isalnum() else "-" for ch in value).strip("-")
    while "--" in cleaned:
        cleaned = cleaned.replace("--", "-")
    return cleaned or "product"


@router.post("/products")
async def create_product(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
    name: str = Form(...),
    sku: str = Form(...),
    price: float = Form(...),
    stock: int = Form(0),
    barcode: str | None = Form(None),
    short_description: str | None = Form(None),
    description: str | None = Form(None),
    brand_id: int | None = Form(None),
    category_id: int | None = Form(None),
    compare_price: float | None = Form(None),
    status: int = Form(1),
    image: UploadFile | None = File(None),
):
    settings = get_settings()
    sku = sku.strip()
    existing = await db.scalar(select(Product).where(Product.sku == sku))
    if existing:
        raise HTTPException(status_code=409, detail="SKU already exists")
    code = normalize_barcode(barcode)
    if code:
        code = validate_barcode(code)
        clash = await db.scalar(select(Product).where(Product.barcode == code))
        if clash:
            raise HTTPException(status_code=409, detail="Barcode already exists")
    slug = _slugify(name)
    if await db.scalar(select(Product).where(Product.slug == slug)):
        slug = f"{slug}-{sku.lower()}"
    product = Product(
        name=name.strip(),
        slug=slug,
        sku=sku,
        barcode=code,
        short_description=short_description,
        description=description,
        price=Decimal(str(price)),
        compare_price=Decimal(str(compare_price)) if compare_price is not None else None,
        stock=stock,
        status=status,
        brand_id=brand_id,
        category_id=category_id,
    )
    db.add(product)
    await db.flush()
    db.add(
        ProductDescription(
            product_id=product.id,
            language_code="en",
            title=product.name,
            short_description=short_description or product.name,
            description=description or short_description or product.name,
        )
    )
    db.add(
        ProductPrice(
            product_id=product.id,
            country_code="NP",
            currency_code="NPR",
            price=product.price,
            compare_price=product.compare_price,
            is_active=True,
        )
    )
    indexing = {"status": None, "message": "No image uploaded"}
    if image is not None and image.filename:
        indexing = await _attach_image(db, product, image, settings)
    await db.commit()
    loaded = await get_visible_product(db, product.id) or product
    payload = product_detail(loaded) if getattr(loaded, "images", None) is not None else {"id": product.id, "sku": product.sku}
    payload["indexing"] = indexing
    return ok(payload, message="Product saved")


@router.post("/products/{product_id}/images")
async def upload_product_image(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
    image: UploadFile = File(...),
    replace_primary: bool = Form(False),
    alt_text: str | None = Form(None),
):
    settings = get_settings()
    product = await db.get(Product, product_id)
    if not product or product.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Product not found")
    indexing = await _attach_image(db, product, image, settings, replace_primary=replace_primary, alt_text=alt_text)
    await db.commit()
    loaded = await get_visible_product(db, product.id) or product
    data = product_detail(loaded)
    data["indexing"] = indexing
    return ok(data, message="Image saved")


@router.post("/products/{product_id}/reindex")
async def reindex_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    product = await db.get(Product, product_id)
    if not product or product.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Product not found")
    rows = await index_product_images(db, product_id, force=True)
    return ok(
        {
            "product_id": product_id,
            "results": [
                {"image_id": r.product_image_id, "status": r.status, "error": r.error_message} for r in rows
            ],
        }
    )


@router.get("/image-indexing/status")
async def image_indexing_status(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    counts = await indexing_status(db)
    return ok(counts)


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    images = (await db.scalars(select(ProductImage).where(ProductImage.product_id == product_id))).all()
    for image in images:
        await cleanup_embeddings_for_image(db, image)
        await db.delete(image)
    product.deleted_at = datetime.now(timezone.utc).replace(tzinfo=None)
    product.status = 0
    await db.commit()
    return ok({"id": product_id, "deleted": True})


async def _attach_image(
    db: AsyncSession,
    product: Product,
    upload: UploadFile,
    settings,
    replace_primary: bool = False,
    alt_text: str | None = None,
) -> dict:
    data = await upload.read(settings.max_upload_bytes + 1)
    image = decode_and_validate(data, upload.content_type, settings.max_upload_bytes, settings.max_image_pixels)
    digest = content_hash(data)
    jpeg = to_jpeg_bytes(image)
    thumb = to_jpeg_bytes(image, size=(400, 400))
    url = save_bytes(jpeg, suffix=".jpg", subdir="products")
    thumb_url = save_bytes(thumb, suffix=".jpg", subdir="products")

    existing_images = (await db.scalars(select(ProductImage).where(ProductImage.product_id == product.id))).all()
    is_primary = replace_primary or len(existing_images) == 0
    if replace_primary:
        for old in existing_images:
            if old.is_primary:
                await cleanup_embeddings_for_image(db, old)
                await db.delete(old)

    duplicate = next((img for img in existing_images if img.content_hash == digest), None)
    if duplicate and not replace_primary:
        rows = await index_product_images(db, product.id, force=False)
        match = next((r for r in rows if r.product_image_id == duplicate.id), None)
        return {
            "status": match.status if match else "INDEXED",
            "message": "Duplicate image reused existing record",
            "image": image_out(duplicate),
        }

    record = ProductImage(
        product_id=product.id,
        image_url=url,
        thumbnail_url=thumb_url,
        alt_text=alt_text or product.name,
        sort_order=len(existing_images),
        is_primary=is_primary,
        content_hash=digest,
    )
    db.add(record)
    await db.flush()
    rows = await index_product_images(db, product.id, force=False)
    match = next((r for r in rows if r.product_image_id == record.id), None)
    status = match.status if match else STATUS_FAILED
    return {
        "status": status,
        "message": None if status == "INDEXED" else (match.error_message if match else "Indexing pending"),
        "image": image_out(record),
    }
