"""Pytest configuration for backend tests.

Uses the real Postgres database (with an isolated upload directory).
"""

from __future__ import annotations

import os
import tempfile

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

# Ensure test settings before importing app modules.
_TEST_UPLOAD_DIR = tempfile.mkdtemp(prefix="sukilo-test-uploads-")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://sukilo:sukilo@127.0.0.1:5432/sukilo")
os.environ.setdefault("UPLOAD_DIR", _TEST_UPLOAD_DIR)
os.environ.setdefault("PUBLIC_BASE_URL", "http://testserver")
os.environ.setdefault("MODEL_VERSION", "phash-color-v1")
os.environ.setdefault("SEED_DEMO", "false")

from app.config import get_settings  # noqa: E402

settings = get_settings()
settings.upload_dir = _TEST_UPLOAD_DIR
settings.public_base_url = "http://testserver"
settings.model_version = "phash-color-v1"
settings.seed_demo = False

# Create a test engine with NullPool so connections are created in the
# current event loop (avoids "attached to a different loop" errors).
_test_engine = create_async_engine(settings.database_url, poolclass=NullPool)
_TestSession = async_sessionmaker(_test_engine, expire_on_commit=False, class_=AsyncSession)


@pytest_asyncio.fixture
async def db_session() -> AsyncSession:
    """Provide a database session that rolls back after the test."""
    connection = await _test_engine.connect()
    transaction = await connection.begin()
    session = _TestSession(bind=connection)
    try:
        yield session
    finally:
        await session.close()
        await transaction.rollback()
        await connection.close()


@pytest.fixture
def client():
    from fastapi.testclient import TestClient

    from app.main import app

    # Patch the app's get_db dependency to use our test engine.
    from app.db import get_db as _real_get_db

    async def _override_get_db():
        async with _TestSession() as session:
            yield session

    app.dependency_overrides[_real_get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
