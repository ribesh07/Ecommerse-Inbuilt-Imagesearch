import type { ProductQuery, ProductSort } from "./api/types";
import { toNumber } from "./format";

/**
 * The product listing page is URL-driven so results are shareable and
 * server-renderable. These helpers translate between the flat URL search
 * params and the typed {@link ProductQuery} the API service expects.
 */

export const PRODUCT_SORTS: Array<{ value: ProductSort; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "popularity", label: "Popularity" },
  { value: "rating", label: "Top rated" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
  { value: "oldest", label: "Oldest" },
];

export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface ParsedProductParams {
  search: string;
  categoryIds: number[];
  brandIds: number[];
  vendorId?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock: boolean;
  sort: ProductSort;
  page: number;
  attributeName?: string;
  attributeValue?: string;
  country?: string;
  /**
   * `category`/`brand` accept either numeric ids or slugs (matching
   * `/product?brand=apple`). Numeric tokens land in `*Ids`; everything else is
   * kept here for server-side slug resolution.
   */
  categorySlugs: string[];
  brandSlugs: string[];
  /** Vendor & category can also be addressed by their readable slug. */
  vendorSlug?: string;
  categorySlug?: string;
  brandSlug?: string;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

interface SplitTokens {
  ids: number[];
  slugs: string[];
}

/** Splits a comma-separated `category`/`brand` value into ids and slugs. */
function splitIdSlug(value: string | string[] | undefined): SplitTokens {
  const raw = first(value);
  if (!raw) return { ids: [], slugs: [] };
  const ids: number[] = [];
  const slugs: string[] = [];
  for (const token of raw.split(",")) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    if (/^\d+$/.test(trimmed)) ids.push(Number.parseInt(trimmed, 10));
    else slugs.push(trimmed);
  }
  return { ids, slugs };
}

function toNum(value: string | string[] | undefined): number | undefined {
  const raw = first(value);
  if (raw === undefined || raw === "") return undefined;
  return toNumber(raw) ?? undefined;
}

const VALID_SORTS = new Set<string>(PRODUCT_SORTS.map((s) => s.value));

/** Parses flat Next.js search params into a typed, validated structure. */
export function parseProductParams(params: RawSearchParams): ParsedProductParams {
  const sortRaw = first(params.sort);
  const sort = (sortRaw && VALID_SORTS.has(sortRaw) ? sortRaw : "newest") as ProductSort;
  const category = splitIdSlug(params.category);
  const brand = splitIdSlug(params.brand);

  return {
    search: first(params.search)?.trim() ?? "",
    categoryIds: category.ids,
    categorySlugs: category.slugs,
    brandIds: brand.ids,
    brandSlugs: brand.slugs,
    vendorId: toNum(params.vendor_id),
    vendorSlug: first(params.vendor),
    brandSlug: first(params.brand_slug),
    categorySlug: first(params.category_slug),
    minPrice: toNum(params.minPrice),
    maxPrice: toNum(params.maxPrice),
    minRating: toNum(params.rating),
    inStock: first(params.inStock) === "true" || first(params.stock) === "in_stock",
    sort,
    page: Math.max(1, Math.floor(toNum(params.page) ?? 1)),
    attributeName: first(params.attribute_name),
    attributeValue: first(params.attribute_value),
    country: first(params.country),
  };
}

/** Builds the API query from parsed URL params (plus resolved id overrides). */
export function toProductQuery(
  parsed: ParsedProductParams,
  overrides: Partial<ProductQuery> = {},
): ProductQuery {
  const categoryIds = overrides.category_ids ?? parsed.categoryIds;
  const brandIds = overrides.brand_ids ?? parsed.brandIds;
  return {
    page: parsed.page,
    limit: 24,
    q: parsed.search || undefined,
    category_ids: categoryIds.length ? categoryIds : undefined,
    brand_ids: brandIds.length ? brandIds : undefined,
    vendor_id: overrides.vendor_id ?? parsed.vendorId,
    min_price: parsed.minPrice,
    max_price: parsed.maxPrice,
    min_rating: parsed.minRating,
    in_stock: parsed.inStock ? true : undefined,
    attribute_name: parsed.attributeName,
    attribute_value: parsed.attributeValue,
    sort: parsed.sort,
    ...overrides,
  };
}

/**
 * Serialises the current state back into a query string for router.push /
 * `<Link>`, omitting defaults so URLs stay clean.
 */
export function buildProductHref(
  state: Partial<ParsedProductParams>,
  extra: Record<string, string | number | undefined> = {},
): string {
  const params = new URLSearchParams();
  const set = (key: string, value: string | number | undefined | null) => {
    if (value !== undefined && value !== null && value !== "" && value !== "newest") {
      params.set(key, String(value));
    }
  };

  set("search", state.search);
  set("category", state.categoryIds?.length ? state.categoryIds.join(",") : undefined);
  set("brand", state.brandIds?.length ? state.brandIds.join(",") : undefined);
  set("category_slug", state.categorySlug);
  set("brand_slug", state.brandSlug);
  set("vendor_id", state.vendorId);
  set("vendor", state.vendorSlug);
  set("minPrice", state.minPrice);
  set("maxPrice", state.maxPrice);
  set("rating", state.minRating);
  set("inStock", state.inStock ? "true" : undefined);
  set("attribute_name", state.attributeName);
  set("attribute_value", state.attributeValue);
  set("sort", state.sort === "newest" ? undefined : state.sort);
  set("page", state.page && state.page > 1 ? state.page : undefined);
  for (const [key, value] of Object.entries(extra)) set(key, value);

  const qs = params.toString();
  return qs ? `/product?${qs}` : "/product";
}
