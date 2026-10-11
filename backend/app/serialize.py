from __future__ import annotations

from decimal import Decimal

from .models import (
    Brand,
    Category,
    Product,
    ProductDescription,
    ProductImage,
    ProductSpecification,
    ProductVariant,
    ProductVendor,
    Review,
    Vendor,
)
from .storage import public_url


def money(amount: Decimal | None, currency: str = "NPR") -> dict:
    return {"amount": format_decimal(amount or Decimal("0")), "currency": currency}


def format_decimal(value: Decimal | int | float | None) -> str:
    if value is None:
        return "0"
    return format(Decimal(str(value)), "f")


def abs_url(url: str | None) -> str | None:
    if not url:
        return None
    if url.startswith("http://") or url.startswith("https://"):
        return url
    return public_url(url)


def brand_brief(brand: Brand | None) -> dict | None:
    if not brand:
        return None
    return {"id": brand.id, "name": brand.name}


def category_brief(category: Category | None) -> dict | None:
    if not category:
        return None
    return {"id": category.id, "name": category.name}


def product_list_item(product: Product, currency: str = "NPR") -> dict:
    primary = next((img for img in sorted(product.images, key=lambda i: (not i.is_primary, i.sort_order))), None)
    return {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "sku": product.sku,
        "brand": brand_brief(product.brand),
        "category": category_brief(product.category),
        "price": money(product.price, currency),
        "thumbnail": abs_url(primary.thumbnail_url if primary else None),
        "rating": format_decimal(product.rating),
        "stock": product.stock,
        "compare_price": format_decimal(product.compare_price) if product.compare_price is not None else None,
        "short_description": product.short_description,
        "descriptions": [description_out(d) for d in product.descriptions],
        "specifications": [spec_out(s) for s in product.specifications],
    }


def description_out(item: ProductDescription) -> dict:
    return {
        "language_code": item.language_code,
        "title": item.title,
        "short_description": item.short_description,
        "description": item.description,
    }


def spec_out(item: ProductSpecification) -> dict:
    return {
        "specification_name": item.specification_name,
        "specification_value": item.specification_value,
        "language_code": item.language_code,
        "sort_order": item.sort_order,
    }


def image_out(item: ProductImage) -> dict:
    return {
        "id": item.id,
        "image_url": abs_url(item.image_url),
        "thumbnail_url": abs_url(item.thumbnail_url),
        "alt_text": item.alt_text,
        "sort_order": item.sort_order,
        "is_primary": item.is_primary,
    }


def variant_out(item: ProductVariant) -> dict:
    attrs = item.attributes or []
    return {
        "id": item.id,
        "sku": item.sku,
        "barcode": item.barcode,
        "variant_name": item.variant_name,
        "price": format_decimal(item.price),
        "compare_price": format_decimal(item.compare_price) if item.compare_price is not None else None,
        "stock": item.stock,
        "status": item.status,
        "attributes": attrs,
    }


def vendor_out(vendor: Vendor, product_count: int | None = None) -> dict:
    payload = {
        "id": vendor.id,
        "name": vendor.name,
        "slug": vendor.slug,
        "email": vendor.email,
        "phone": vendor.phone,
        "logo_url": abs_url(vendor.logo_url),
        "country_code": vendor.country_code,
    }
    if product_count is not None:
        payload["product_count"] = product_count
    return payload


def product_vendor_out(offer: ProductVendor) -> dict:
    return {
        "id": offer.vendor.id if offer.vendor else offer.vendor_id,
        "name": offer.vendor.name if offer.vendor else "",
        "slug": offer.vendor.slug if offer.vendor else None,
        "vendor_sku": offer.vendor_sku,
        "price": format_decimal(offer.price),
        "stock": offer.stock,
    }


def review_out(item: Review) -> dict:
    return {
        "id": item.id,
        "rating": item.rating,
        "title": item.title,
        "review": item.review,
        "is_verified_purchase": item.is_verified_purchase,
        "created_at": item.created_at.isoformat() if item.created_at else "",
    }


def product_detail(product: Product) -> dict:
    return {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "sku": product.sku,
        "barcode": product.barcode,
        "short_description": product.short_description,
        "description": product.description,
        "price": format_decimal(product.price),
        "compare_price": format_decimal(product.compare_price) if product.compare_price is not None else None,
        "stock": product.stock,
        "rating": format_decimal(product.rating),
        "review_count": product.review_count,
        "weight": format_decimal(product.weight) if product.weight is not None else None,
        "status": product.status,
        "created_at": product.created_at.isoformat() if product.created_at else "",
        "brand": {
            "id": product.brand.id,
            "name": product.brand.name,
            "slug": product.brand.slug,
            "logo_url": abs_url(product.brand.logo_url),
            "description": product.brand.description,
        }
        if product.brand
        else None,
        "category": {
            "id": product.category.id,
            "name": product.category.name,
            "slug": product.category.slug,
            "description": product.category.description,
            "image_url": abs_url(product.category.image_url),
            "level": product.category.level,
            "parent_id": product.category.parent_id,
        }
        if product.category
        else None,
        "images": [image_out(i) for i in sorted(product.images, key=lambda x: x.sort_order)],
        "prices": [
            {
                "id": p.id,
                "country_code": p.country_code,
                "currency_code": p.currency_code,
                "price": format_decimal(p.price),
                "compare_price": format_decimal(p.compare_price) if p.compare_price is not None else None,
                "is_active": p.is_active,
            }
            for p in product.prices
        ],
        "descriptions": [description_out(d) for d in product.descriptions],
        "specifications": [spec_out(s) for s in product.specifications],
        "variants": [variant_out(v) for v in product.variants],
        "vendors": [product_vendor_out(v) for v in product.vendors],
        "review_summary": {
            "average_rating": float(product.rating or 0),
            "total_reviews": product.review_count,
            "distribution": {},
        },
    }


def brand_out(brand: Brand, product_count: int | None = None) -> dict:
    payload = {
        "id": brand.id,
        "name": brand.name,
        "slug": brand.slug,
        "logo_url": abs_url(brand.logo_url),
        "description": brand.description,
    }
    if product_count is not None:
        payload["product_count"] = product_count
    return payload


def category_out(category: Category, product_count: int | None = None) -> dict:
    payload = {
        "id": category.id,
        "parent_id": category.parent_id,
        "name": category.name,
        "slug": category.slug,
        "description": category.description,
        "image_url": abs_url(category.image_url),
        "level": category.level,
    }
    if product_count is not None:
        payload["product_count"] = product_count
    return payload
