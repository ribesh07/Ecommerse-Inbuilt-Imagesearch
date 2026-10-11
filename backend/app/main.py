from __future__ import annotations

import logging
import time
from collections import defaultdict
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import SQLAlchemyError

from .config import get_settings
from .db import SessionLocal
from .migrate import apply_sql
from .routers.admin import router as admin_router
from .routers.auth import router as auth_router
from .routers.catalog_meta import router as catalog_router
from .routers.products import router as products_router
from .security import ensure_admin_user
from .seed import seed_demo
from .storage import ensure_upload_dir

logger = logging.getLogger("sukilo")
logging.basicConfig(level=logging.INFO)

settings = get_settings()

app = FastAPI(
    title="Sukilo Ecommerce API",
    version="1.0.0",
    description=(
        "Storefront catalog API plus admin image upload, visual search, "
        "barcode lookup, and voice/text search filters."
    ),
    openapi_tags=[
        {"name": "Health", "description": "Liveness and dependency checks"},
        {"name": "Auth", "description": "Admin login"},
        {"name": "Products", "description": "Public catalog browsing and text search"},
        {"name": "Image Search", "description": "Customer visual similarity search"},
        {"name": "Image Upload", "description": "Admin product image upload and CLIP indexing"},
        {"name": "Admin", "description": "Authenticated catalog management"},
        {"name": "Catalog", "description": "Brands, categories, and vendors"},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_hits: dict[str, list[float]] = defaultdict(list)


@app.middleware("http")
async def rate_limit(request: Request, call_next):
    if request.url.path.endswith("/search/image") or "/barcode/" in request.url.path:
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = [t for t in _hits[ip] if now - t < 60]
        if len(window) >= 30:
            return JSONResponse(
                status_code=429,
                content={"success": False, "data": None, "message": "Too many search requests"},
            )
        window.append(now)
        _hits[ip] = window
    return await call_next(request)


def _error(status_code: int, message: str, detail=None) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "data": None, "message": message, "detail": detail},
    )


@app.exception_handler(HTTPException)
async def http_error(_request: Request, exc: HTTPException):
    return _error(exc.status_code, str(exc.detail), exc.detail)


@app.exception_handler(RequestValidationError)
async def validation_error(_request: Request, exc: RequestValidationError):
    return _error(422, "Invalid request", exc.errors())


@app.exception_handler(SQLAlchemyError)
async def db_error(_request: Request, _exc: SQLAlchemyError):
    logger.exception("Database error")
    return _error(503, "Database is temporarily unavailable")


@app.on_event("startup")
async def startup():
    ensure_upload_dir()
    try:
        apply_sql()
    except Exception:
        logger.exception("Schema migrate skipped or failed")
    async with SessionLocal() as db:
        try:
            await ensure_admin_user(db)
            if settings.seed_demo and settings.app_env != "production":
                await seed_demo(db, index=True)
        except Exception:
            logger.exception("Startup seed/admin bootstrap failed")


@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
async def health():
    from sqlalchemy import text

    from .db import engine

    db_ok = False
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            db_ok = True
    except Exception:
        db_ok = False
    status = "ok" if db_ok else "degraded"
    return {
        "status": status,
        "database": db_ok,
        "model_version": settings.model_version,
        "image_search_url": settings.image_search_url,
    }


app.include_router(auth_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(catalog_router, prefix="/api/v1")

upload_root = Path(settings.upload_dir)
upload_root.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_root)), name="uploads")
