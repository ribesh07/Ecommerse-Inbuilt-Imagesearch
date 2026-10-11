from __future__ import annotations

import argparse
import asyncio

from .db import SessionLocal
from .indexing import backfill_catalog, index_product_images
from .migrate import apply_sql, wait_for_db
from .models import Product
from .seed import seed_demo
from .security import ensure_admin_user
from sqlalchemy import select


async def cmd_index(force: bool) -> None:
    await wait_for_db()
    async with SessionLocal() as db:
        stats = await backfill_catalog(db, force=force)
        print(stats)


async def cmd_seed() -> None:
    await wait_for_db()
    async with SessionLocal() as db:
        await ensure_admin_user(db)
        result = await seed_demo(db, index=True)
        print(result)


async def cmd_retry() -> None:
    await wait_for_db()
    async with SessionLocal() as db:
        ids = (await db.scalars(select(Product.id).where(Product.deleted_at.is_(None)))).all()
        for product_id in ids:
            rows = await index_product_images(db, product_id, force=False)
            failed = [r.id for r in rows if r.status == "FAILED"]
            if failed:
                print(f"product {product_id} still failed: {failed}")
        print("retry complete")


def main() -> None:
    parser = argparse.ArgumentParser(description="Sukilo catalog tooling")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("migrate")
    index_p = sub.add_parser("index-catalog")
    index_p.add_argument("--force", action="store_true")
    sub.add_parser("seed-demo")
    sub.add_parser("retry-failed-index")
    args = parser.parse_args()
    if args.command == "migrate":
        asyncio.run(wait_for_db())
        apply_sql()
    elif args.command == "index-catalog":
        asyncio.run(cmd_index(force=args.force))
    elif args.command == "seed-demo":
        asyncio.run(cmd_seed())
    elif args.command == "retry-failed-index":
        asyncio.run(cmd_retry())


if __name__ == "__main__":
    main()
