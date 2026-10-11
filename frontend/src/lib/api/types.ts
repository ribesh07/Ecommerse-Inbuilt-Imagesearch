/**
 * Types mirroring the FastAPI response schemas (Ecommerce API v1).
 *
 * The API wraps every payload in a `{ success, data, message }` envelope.
 * Numeric fields that originate from MySQL `DECIMAL` columns are serialised as
 * strings (e.g. `"55168.07"`), so we type them as `string` and convert at the
 * edge with `toNumber`. Nothing here is invented: each shape was verified
 * against the live `/openapi.json` and real responses.
 */

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string | null;
}

export interface Pagination {
  limit: number;
  has_next: boolean;
  page: number;
  total: number;
  /** Present only when cursor/keyset pagination is requested. */
  cursor?: string | null;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

/* -------------------------------------------------------------------------- */
/*                                   Brand                                    */
/* -------------------------------------------------------------------------- */

export interface Brand {
  id: number;
  name: string;
  slug?: string;
  logo_url?: string | null;
  description?: string | null;
  product_count?: number | null;
}

/* -------------------------------------------------------------------------- */
/*                                  Category                                  */
/* -------------------------------------------------------------------------- */

export interface Category {
  id: number;
  parent_id?: number | null;
  name: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  level?: number;
  product_count?: number | null;
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
}

/* -------------------------------------------------------------------------- */
/*                                   Vendor                                   */
/* -------------------------------------------------------------------------- */

export interface Vendor {
  id: number;
  name: string;
  slug?: string;
  email?: string | null;
  phone?: string | null;
  logo_url?: string | null;
  country_code?: string | null;
  product_count?: number | null;
  /** Not currently returned by the API — reserved for future verification. */
  is_verified?: boolean;
}

/** A vendor offer attached to a product (`/products/{id}/vendors`). */
export interface ProductVendor {
  id: number;
  name: string;
  slug?: string;
  vendor_sku?: string;
  price: string;
  stock: number;
}

/* -------------------------------------------------------------------------- */
/*                                   Money                                    */
/* -------------------------------------------------------------------------- */

export interface Money {
  amount: string;
  currency: string;
}

export interface ProductPrice {
  id: number;
  country_code: string;
  currency_code: string;
  price: string;
  compare_price?: string | null;
  is_active: boolean;
}

/** Price facet returned by `/products/filters`. */
export interface PriceRange {
  min: number;
  max: number;
}

export interface FacetItem {
  id: number;
  name: string;
  count: number;
}

export interface RatingFacet {
  rating: number;
  count?: number;
}

export interface ProductFilters {
  brands: FacetItem[];
  categories: FacetItem[];
  vendors: FacetItem[];
  price: PriceRange;
  /** The API returns a list of available rating buckets. */
  ratings: Array<number | RatingFacet>;
}

/* -------------------------------------------------------------------------- */
/*                                Localisation                                */
/* -------------------------------------------------------------------------- */

export interface ProductDescription {
  language_code: string;
  title: string;
  short_description: string;
  description: string;
}

export interface ProductSpecification {
  specification_name: string;
  specification_value: string;
  language_code: string;
  sort_order: number;
}

/* -------------------------------------------------------------------------- */
/*                                   Product                                  */
/* -------------------------------------------------------------------------- */

/** Compact product shape returned by list/search endpoints. */
export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  sku: string;
  brand: Pick<Brand, "id" | "name"> | null;
  category: Pick<Category, "id" | "name"> | null;
  price: Money;
  thumbnail: string | null;
  rating: string;
  stock: number;
  compare_price: string | null;
  short_description: string | null;
  descriptions?: ProductDescription[];
  specifications?: ProductSpecification[];
  /** Present only for image-search results; 0..1 visual similarity score. */
  similarity?: number;
}

export interface ProductImage {
  id: number;
  image_url: string;
  thumbnail_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductVariantAttribute {
  attribute_name: string;
  attribute_value: string;
}

export interface ProductVariant {
  id: number;
  sku: string;
  barcode: string | null;
  variant_name: string;
  price: string;
  compare_price: string | null;
  stock: number;
  status: number;
  attributes: ProductVariantAttribute[];
}

export interface Review {
  id: number;
  rating: number;
  title: string;
  review: string;
  is_verified_purchase: boolean;
  created_at: string;
}

export interface ReviewSummary {
  average_rating: number;
  total_reviews: number;
  distribution: Record<string, number>;
}

/** Full product shape returned by `/products/{id}`. */
export interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  sku: string;
  barcode: string | null;
  short_description: string | null;
  description: string | null;
  price: string;
  compare_price: string | null;
  stock: number;
  rating: string;
  review_count: number;
  weight: string | null;
  status: number;
  created_at: string;
  brand: Brand | null;
  category: Category | null;
  images: ProductImage[];
  prices: ProductPrice[];
  descriptions: ProductDescription[];
  specifications: ProductSpecification[];
  variants: ProductVariant[];
  vendors: ProductVendor[];
  review_summary: ReviewSummary | null;
}

/* -------------------------------------------------------------------------- */
/*                              Query parameters                              */
/* -------------------------------------------------------------------------- */

export type ProductSort =
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "rating"
  | "popularity"
  | "name_asc"
  | "name_desc";

export interface ProductQuery {
  page?: number;
  limit?: number;
  cursor?: string;
  use_cursor?: boolean;
  category_id?: number;
  brand_id?: number;
  vendor_id?: number;
  category_ids?: number[];
  brand_ids?: number[];
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  in_stock?: boolean;
  q?: string;
  sort?: ProductSort;
  attribute_name?: string;
  attribute_value?: string;
}
