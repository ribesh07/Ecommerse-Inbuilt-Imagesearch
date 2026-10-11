import { request, requestPaginated, type RequestOptions } from "./client";
import type {
  Paginated,
  ProductDetail,
  ProductListItem,
  ProductQuery,
  ProductVariant,
  ProductVendor,
  ProductImage,
  Review,
  ReviewSummary,
} from "./types";

type QueryValue = string | number | boolean | undefined | null | Array<string | number>;

/** Serialises the typed product query into API query params. */
function toParams(query: ProductQuery = {}): Record<string, QueryValue> {
  return {
    page: query.page,
    limit: query.limit,
    cursor: query.cursor,
    use_cursor: query.use_cursor,
    category_id: query.category_id,
    brand_id: query.brand_id,
    vendor_id: query.vendor_id,
    category_ids: query.category_ids,
    brand_ids: query.brand_ids,
    min_price: query.min_price,
    max_price: query.max_price,
    min_rating: query.min_rating,
    in_stock: query.in_stock,
    q: query.q,
    sort: query.sort,
    attribute_name: query.attribute_name,
    attribute_value: query.attribute_value,
  };
}

/** GET /api/v1/products — filters, sorting, offset/keyset pagination. */
export function listProducts(
  query: ProductQuery = {},
  options: RequestOptions = {},
): Promise<Paginated<ProductListItem>> {
  return requestPaginated<ProductListItem>("/products", toParams(query), options);
}

/** GET /api/v1/products/search — full-text product search. */
export function searchProducts(
  q: string,
  query: Omit<ProductQuery, "q"> = {},
  options: RequestOptions = {},
): Promise<Paginated<ProductListItem>> {
  return requestPaginated<ProductListItem>(
    "/products/search",
    { ...toParams(query), q },
    options,
  );
}

/** GET /api/v1/products/featured — top-rated products. */
export function getFeaturedProducts(
  { page = 1, limit = 12 }: { page?: number; limit?: number } = {},
  options: RequestOptions = {},
): Promise<Paginated<ProductListItem>> {
  return requestPaginated<ProductListItem>("/products/featured", { page, limit }, options);
}

/** GET /api/v1/products/latest — newest products. */
export function getLatestProducts(
  { page = 1, limit = 12 }: { page?: number; limit?: number } = {},
  options: RequestOptions = {},
): Promise<Paginated<ProductListItem>> {
  return requestPaginated<ProductListItem>("/products/latest", { page, limit }, options);
}

/** GET /api/v1/products/{id} — full product detail. */
export function getProduct(
  id: number,
  options: RequestOptions = {},
): Promise<ProductDetail> {
  return request<ProductDetail>(`/products/${id}`, options);
}

/** GET /api/v1/products/{id}/related — same-category products. */
export function getRelatedProducts(
  id: number,
  limit = 12,
  options: RequestOptions = {},
): Promise<Paginated<ProductListItem>> {
  return requestPaginated<ProductListItem>(`/products/${id}/related`, { limit }, options);
}

/** GET /api/v1/products/{id}/variants */
export function getProductVariants(
  id: number,
  options: RequestOptions = {},
): Promise<ProductVariant[]> {
  return request<ProductVariant[]>(`/products/${id}/variants`, options);
}

/** GET /api/v1/products/{id}/vendors — competing vendor offers. */
export function getProductVendors(
  id: number,
  options: RequestOptions = {},
): Promise<ProductVendor[]> {
  return request<ProductVendor[]>(`/products/${id}/vendors`, options);
}

/** GET /api/v1/products/{id}/images */
export function getProductImages(
  id: number,
  options: RequestOptions = {},
): Promise<ProductImage[]> {
  return request<ProductImage[]>(`/products/${id}/images`, options);
}

/** GET /api/v1/products/{id}/reviews */
export function getProductReviews(
  id: number,
  { page = 1, limit = 10 }: { page?: number; limit?: number } = {},
  options: RequestOptions = {},
): Promise<Paginated<Review>> {
  return requestPaginated<Review>(`/products/${id}/reviews`, { page, limit }, options);
}

/** GET /api/v1/products/{id}/reviews/summary */
export function getReviewSummary(
  id: number,
  options: RequestOptions = {},
): Promise<ReviewSummary> {
  return request<ReviewSummary>(`/products/${id}/reviews/summary`, options);
}
