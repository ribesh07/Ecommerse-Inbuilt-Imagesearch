from __future__ import annotations

import asyncio
from pathlib import Path

import psycopg
from sqlalchemy import text
import sqlparse

from .config import get_settings
from .db import engine

MIGRATIONS_ROOT = Path(__file__).resolve().parent.parent / "prisma" / "migrations"

INIT_MIGRATION = (
    MIGRATIONS_ROOT
    / "20241011120000_init_catalog_and_embeddings"
    / "migration.sql"
)


async def wait_for_db(retries: int = 30) -> None:
    for attempt in range(retries):
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            print("Database connection successful")
            return
        except Exception:
            if attempt == retries - 1:
                raise
            await asyncio.sleep(1)


def _list_migration_dirs() -> list[Path]:
    """Return migration directories sorted by name (timestamp prefix)."""
    if not MIGRATIONS_ROOT.is_dir():
        return []
    dirs = [p for p in MIGRATIONS_ROOT.iterdir() if p.is_dir() and (p / "migration.sql").is_file()]
    return sorted(dirs, key=lambda p: p.name)


def _ensure_migrations_table(conn) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS "_schema_migrations" (
            name TEXT PRIMARY KEY,
            applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )


def _applied_migrations(conn) -> set[str]:
    rows = conn.execute("SELECT name FROM _schema_migrations").fetchall()
    return {row[0] for row in rows}


def _apply_init_migration(conn) -> None:
    """Apply the initial schema migration. Idempotent: skipped if `products` exists."""
    exists = conn.execute("SELECT to_regclass('public.products')").fetchone()
    if exists and exists[0]:
        print("Schema already present; skipping init migration")
        return
    sql = INIT_MIGRATION.read_text(encoding="utf-8")
    statements = sqlparse.split(sql)
    for statement in statements:
        stmt = statement.strip()
        if not stmt:
            continue
        cleaned = sqlparse.format(stmt, strip_comments=True).strip()
        if not cleaned:
            continue
        conn.execute(cleaned)
    print("Applied 20241011120000_init_catalog_and_embeddings")


def apply_sql() -> None:
    settings = get_settings()
    with psycopg.connect(settings.sync_database_url) as conn:
        conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
        _ensure_migrations_table(conn)

        # Apply the init migration first (handles fresh databases).
        _apply_init_migration(conn)

        # Mark the init migration as applied if not already.
        applied = _applied_migrations(conn)
        init_name = "20241011120000_init_catalog_and_embeddings"
        if init_name not in applied:
            conn.execute(
                "INSERT INTO _schema_migrations (name) VALUES (%s) ON CONFLICT DO NOTHING",
                (init_name,),
            )
            applied.add(init_name)

        # Apply any additional migrations in order.
        for migration_dir in _list_migration_dirs():
            name = migration_dir.name
            if name in applied:
                continue
            sql = (migration_dir / "migration.sql").read_text(encoding="utf-8")
            statements = sqlparse.split(sql)
            for statement in statements:
                stmt = statement.strip()
                if not stmt:
                    continue
                cleaned = sqlparse.format(stmt, strip_comments=True).strip()
                if not cleaned:
                    continue
                conn.execute(cleaned)
            conn.execute(
                "INSERT INTO _schema_migrations (name) VALUES (%s) ON CONFLICT DO NOTHING",
                (name,),
            )
            print(f"Applied {name}")

        conn.commit()


def main() -> None:
    asyncio.run(wait_for_db())
    apply_sql()


if __name__ == "__main__":
    main()
