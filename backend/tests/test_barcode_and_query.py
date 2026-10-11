import pytest
from fastapi import HTTPException

from app.barcode import normalize_barcode, validate_barcode
from app.query_parser import parse_product_query, validate_price_range


def test_leading_zeros_preserved():
    assert normalize_barcode("00123456") == "00123456"
    assert validate_barcode("0123456789012") == "0123456789012"


def test_invalid_barcode_rejected():
    with pytest.raises(HTTPException):
        validate_barcode("***")
    with pytest.raises(HTTPException):
        validate_barcode("")


def test_voice_query_price_and_availability():
    parsed = parse_product_query("show me red nike shoes under 5000 in stock")
    assert parsed.max_price == 5000
    assert parsed.in_stock is True
    assert parsed.color == "red"
    assert "shoes" in parsed.q.lower()


def test_price_range_validation():
    with pytest.raises(ValueError):
        validate_price_range(10, 5)
    assert validate_price_range(1, 9) == (1, 9)
