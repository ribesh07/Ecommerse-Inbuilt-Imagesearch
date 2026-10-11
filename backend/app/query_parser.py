from __future__ import annotations

import re
from dataclasses import dataclass, field

COLOR_WORDS = {
    "red",
    "blue",
    "green",
    "black",
    "white",
    "yellow",
    "pink",
    "purple",
    "orange",
    "brown",
    "grey",
    "gray",
    "gold",
    "silver",
}

UNDER_RE = re.compile(
    r"\b(?:under|below|less than|upto|up to|cheaper than)\s*(?:npr|rs|usd|\$)?\s*(\d+(?:\.\d+)?)",
    re.I,
)
OVER_RE = re.compile(
    r"\b(?:over|above|more than|at least|greater than)\s*(?:npr|rs|usd|\$)?\s*(\d+(?:\.\d+)?)",
    re.I,
)
BETWEEN_RE = re.compile(
    r"\bbetween\s*(?:npr|rs|usd|\$)?\s*(\d+(?:\.\d+)?)\s*(?:and|-)\s*(?:npr|rs|usd|\$)?\s*(\d+(?:\.\d+)?)",
    re.I,
)


@dataclass
class ParsedQuery:
    q: str
    min_price: float | None = None
    max_price: float | None = None
    in_stock: bool | None = None
    color: str | None = None
    category_hint: str | None = None
    brand_hint: str | None = None
    extras: dict = field(default_factory=dict)


def parse_product_query(text: str) -> ParsedQuery:
    raw = (text or "").strip()
    remaining = raw
    parsed = ParsedQuery(q=raw)

    between = BETWEEN_RE.search(remaining)
    if between:
        parsed.min_price = float(between.group(1))
        parsed.max_price = float(between.group(2))
        remaining = BETWEEN_RE.sub(" ", remaining)

    under = UNDER_RE.search(remaining)
    if under:
        parsed.max_price = float(under.group(1))
        remaining = UNDER_RE.sub(" ", remaining)

    over = OVER_RE.search(remaining)
    if over:
        parsed.min_price = float(over.group(1))
        remaining = OVER_RE.sub(" ", remaining)

    if re.search(r"\b(in stock|available)\b", remaining, re.I):
        parsed.in_stock = True
        remaining = re.sub(r"\b(in stock|available)\b", " ", remaining, flags=re.I)
    if re.search(r"\b(out of stock)\b", remaining, re.I):
        parsed.in_stock = False
        remaining = re.sub(r"\b(out of stock)\b", " ", remaining, flags=re.I)

    tokens = [t for t in re.split(r"\s+", remaining) if t]
    colors = [t.lower() for t in tokens if t.lower() in COLOR_WORDS]
    if colors:
        parsed.color = colors[0]
        tokens = [t for t in tokens if t.lower() not in COLOR_WORDS]

    remaining = " ".join(tokens)
    remaining = re.sub(r"\b(show me|find|search for|i want|looking for)\b", " ", remaining, flags=re.I)
    parsed.q = re.sub(r"\s+", " ", remaining).strip() or raw
    return parsed


def validate_price_range(min_price: float | None, max_price: float | None) -> tuple[float | None, float | None]:
    if min_price is not None and min_price < 0:
        raise ValueError("min_price must be >= 0")
    if max_price is not None and max_price < 0:
        raise ValueError("max_price must be >= 0")
    if min_price is not None and max_price is not None and min_price > max_price:
        raise ValueError("min_price cannot be greater than max_price")
    return min_price, max_price
