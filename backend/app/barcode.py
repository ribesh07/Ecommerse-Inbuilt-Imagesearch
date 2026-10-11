import re

from fastapi import HTTPException

# Keep barcodes as strings so leading zeros survive.
EAN_UPC = re.compile(r"^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$")
CODE128 = re.compile(r"^[A-Za-z0-9\-_.]{4,64}$")


def normalize_barcode(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def validate_barcode(value: str) -> str:
    code = normalize_barcode(value)
    if not code:
        raise HTTPException(status_code=400, detail="Barcode is required")
    if EAN_UPC.match(code) or CODE128.match(code):
        return code
    raise HTTPException(
        status_code=400,
        detail="Invalid barcode. Use EAN-8/12/13/14 digits or a 4–64 character CODE128 value.",
    )
