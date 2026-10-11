from __future__ import annotations

import hashlib
from decimal import Decimal
from io import BytesIO

from PIL import Image, ImageDraw
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .image_util import content_hash
from .indexing import index_product_images
from .models import Brand, Category, Product, ProductDescription, ProductImage, ProductPrice, ProductVariant, Vendor
from .storage import save_bytes


def _swatch(color: tuple[int, int, int], label: str) -> bytes:
    image = Image.new("RGB", (512, 512), color)
    draw = ImageDraw.Draw(image)
    draw.rectangle((40, 40, 472, 472), outline=(255, 255, 255), width=8)
    draw.rectangle((180, 180, 332, 332), fill=(255, 255, 255))
    buffer = BytesIO()
    image.save(buffer, format="JPEG", quality=90)
    return buffer.getvalue()


DEMO_PRODUCTS = [
    {
        "name": "Aurora Wireless Headphones",
        "sku": "SKU-HEAD-001",
        "barcode": "8901234567890",
        "price": "129.00",
        "stock": 18,
        "color": (30, 90, 180),
        "category": "audio",
        "brand": "aurora",
        "short": "Over-ear wireless headphones with deep bass.",
    },
    {
        "name": "Nimbus Bluetooth Speaker",
        "sku": "SKU-SPK-002",
        "barcode": "8901234567891",
        "price": "79.00",
        "stock": 24,
        "color": (20, 140, 90),
        "category": "audio",
        "brand": "nimbus",
        "short": "Portable speaker for travel and desks.",
    },
    {
        "name": "Trailfire Running Shoes",
        "sku": "SKU-SHOE-003",
        "barcode": "0123456789012",
        "price": "99.00",
        "stock": 12,
        "color": (200, 60, 40),
        "category": "footwear",
        "brand": "trailfire",
        "short": "Lightweight running shoes for daily training.",
    },
    {
        "name": "Cedar Canvas Backpack",
        "sku": "SKU-BAG-004",
        "barcode": "0123456789055",
        "price": "59.00",
        "stock": 30,
        "color": (120, 72, 40),
        "category": "bags",
        "brand": "cedar",
        "short": "Everyday backpack with a padded laptop sleeve.",
    },
    {
        "name": "Lumen Smart Watch",
        "sku": "SKU-WATCH-005",
        "barcode": "000123456789",
        "price": "149.00",
        "stock": 9,
        "color": (40, 40, 40),
        "category": "wearables",
        "brand": "lumen",
        "short": "Fitness smart watch with heart-rate tracking.",
    },
    {
        "name": "Draft Inactive Camera",
        "sku": "SKU-CAM-000",
        "barcode": "9990001112223",
        "price": "499.00",
        "stock": 2,
        "color": (90, 90, 90),
        "category": "audio",
        "brand": "aurora",
        "short": "Unpublished sample used to verify visibility filters.",
        "status": 0,
    },
]


async def seed_demo(db: AsyncSession, index: bool = True) -> dict:
    settings = get_settings()
    if settings.app_env == "production":
        raise RuntimeError("Refusing to seed demo products in production")

    categories = {}
    for slug, name in [
        ("audio", "Audio"),
        ("footwear", "Footwear"),
        ("bags", "Bags"),
        ("wearables", "Wearables"),
    ]:
        row = await db.scalar(select(Category).where(Category.slug == slug))
        if not row:
            row = Category(name=name, slug=slug, level=0)
            db.add(row)
            await db.flush()
        categories[slug] = row

    brands = {}
    for slug, name in [
        ("aurora", "Aurora"),
        ("nimbus", "Nimbus"),
        ("trailfire", "Trailfire"),
        ("cedar", "Cedar"),
        ("lumen", "Lumen"),
    ]:
        row = await db.scalar(select(Brand).where(Brand.slug == slug))
        if not row:
            row = Brand(name=name, slug=slug)
            db.add(row)
            await db.flush()
        brands[slug] = row

    vendor = await db.scalar(select(Vendor).where(Vendor.slug == "sukilo-demo"))
    if not vendor:
        vendor = Vendor(name="Sukilo Demo Store", slug="sukilo-demo", country_code="NP")
        db.add(vendor)
        await db.flush()

    created = 0
    for item in DEMO_PRODUCTS:
        existing = await db.scalar(select(Product).where(Product.sku == item["sku"]))
        if existing:
            continue
        product = Product(
            name=item["name"],
            slug=item["sku"].lower(),
            sku=item["sku"],
            barcode=item["barcode"],
            short_description=item["short"],
            description=item["short"],
            price=Decimal(item["price"]),
            stock=item["stock"],
            rating=Decimal("4.40"),
            review_count=8,
            status=item.get("status", 1),
            brand_id=brands[item["brand"]].id,
            category_id=categories[item["category"]].id,
        )
        db.add(product)
        await db.flush()
        db.add(
            ProductDescription(
                product_id=product.id,
                language_code="en",
                title=product.name,
                short_description=item["short"],
                description=item["short"],
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
        db.add(
            ProductVariant(
                product_id=product.id,
                sku=f"{item['sku']}-DEF",
                barcode=None,
                variant_name="Default",
                price=product.price,
                stock=product.stock,
                status=1,
                attributes=[],
            )
        )
        jpeg = _swatch(item["color"], item["name"])
        url = save_bytes(jpeg, suffix=".jpg", subdir="products")
        db.add(
            ProductImage(
                product_id=product.id,
                image_url=url,
                thumbnail_url=url,
                alt_text=item["name"],
                sort_order=0,
                is_primary=True,
                content_hash=content_hash(jpeg),
            )
        )
        created += 1
        if index:
            await db.commit()
            await index_product_images(db, product.id, force=False)

    await db.commit()
    return {"created": created, "model_version": settings.model_version, "seed_prefix": "SKU-"}
