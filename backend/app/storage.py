from __future__ import annotations

import uuid
from pathlib import Path

from .config import get_settings


def ensure_upload_dir() -> Path:
    path = Path(get_settings().upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def public_url(relative: str) -> str:
    settings = get_settings()
    rel = relative if relative.startswith("/") else f"/{relative}"
    return f"{settings.public_base_url.rstrip('/')}{rel}"


def save_bytes(data: bytes, suffix: str = ".jpg", subdir: str = "products") -> str:
    folder = ensure_upload_dir() / subdir
    folder.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{suffix}"
    dest = folder / name
    dest.write_bytes(data)
    return f"/uploads/{subdir}/{name}"


def delete_local_url(url: str | None) -> None:
    if not url:
        return
    prefix = "/uploads/"
    if not url.startswith(prefix) and "/uploads/" not in url:
        return
    relative = url[url.find("/uploads/") :]
    path = Path(get_settings().upload_dir) / relative.removeprefix("/uploads/")
    if path.is_file():
        path.unlink(missing_ok=True)
